import { Scheduler } from "./cpu/scheduler";
import { Disk } from "./disk/disk";
import { Process } from "./models/process";

export class Simulator {
  cpuQueue = new Scheduler();
  diskQueue = new Disk();
  currentProcessCPU: Process | null = null;
  time = 0;
  quantum: number;
  quantumCounter = 0;
  totalTime: number;
  processes: Process[] = [];
  timeline: { time: number; cpuProcessId: number | null; diskProcessId: number | null }[] = [];

  constructor(quantum: number, totalTime: number) {
    this.quantum = quantum;
    this.totalTime = totalTime;
  }

  // ✅ Adicione esta função exatamente assim
  getAverageWaitingTime = (): number => {
    const total = this.processes.reduce((sum, p) => sum + (p.waitingTime || 0), 0);
    return this.processes.length ? total / this.processes.length : 0;
  };

  getDiskUsage = (): number => {
    const active = this.timeline.filter(t => t.diskProcessId !== null).length;
    return this.timeline.length ? (active / this.timeline.length) * 100 : 0;
  };
  
  getCPUUsage = (): number => {
    const active = this.timeline.filter(t => t.cpuProcessId !== null).length;
    return this.timeline.length ? (active / this.timeline.length) * 100 : 0;
  };

  getFinishedCount = (): number => {
    return this.processes.filter(p => p.state === "terminated").length;
  };

  addProcess = (process: Process) => {
    const existing = this.processes.find((p) => p.name === process.name);
    if (existing) {
      existing.bursts.push(...process.bursts);
      return;
    }
    process.currentBurst = 0;
    process.remainingCpu = process.bursts[0].cpu;
    process.state = "ready";
    process.waitingTime = 0;
    this.processes.push(process);
    this.cpuQueue.add(process);
  };
  
 // /core/simulator.ts

tick = () => {
  if (this.time >= this.totalTime) return;

  // 1. DISCO: Processa E/S
  const { finished, running: currentDiskProcess } = this.diskQueue.tick();

  // Quando sai do disco, o ciclo (CPU + IO) desse burst acabou.
  // AGORA sim avançamos para o próximo burst.
  finished.forEach((p) => {
    p.currentBurst++; 
    if (p.currentBurst < p.bursts.length) {
      p.remainingCpu = p.bursts[p.currentBurst].cpu; // Carrega nova CPU
      p.state = "ready";
      this.cpuQueue.add(p); 
    } else {
      p.state = "terminated";
      p.finishTime = this.time;
    }
  });

  // 2. PREEMPÇÃO (Quantum)
  // Se o quantum acabou, mas o processo ainda tem CPU (remainingCpu > 0),
  // ele volta para a fila SEM mudar o currentBurst.
  if (this.currentProcessCPU && this.quantumCounter >= this.quantum) {
    const p = this.currentProcessCPU;
    if (p.remainingCpu > 0) {
      p.state = "ready";
      this.cpuQueue.addFirst(p); // Volta para o topo para retomar o que faltava
    }
    this.currentProcessCPU = null;
  }

  // 3. SELEÇÃO
  if (!this.currentProcessCPU) {
    this.currentProcessCPU = this.cpuQueue.next();
    this.quantumCounter = 0;
  }

  // 4. EXECUÇÃO
  if (this.currentProcessCPU) {
    const p = this.currentProcessCPU;
    p.state = "running";
    p.remainingCpu--;
    this.quantumCounter++;

    this.timeline.push({
      time: this.time,
      cpuProcessId: p.id,
      diskProcessId: currentDiskProcess ? currentDiskProcess.id : null
    });

    // 5. TÉRMINO DO BURST DE CPU
    if (p.remainingCpu <= 0) {
      const burstData = p.bursts[p.currentBurst];

      if (burstData && burstData.io > 0) {
        // Se tem disco, vai para a fila de espera do disco
        p.remainingIo = burstData.io;
        p.state = "waiting";
        this.diskQueue.add(p);
        // O currentBurst SÓ avança quando ele sair do disco (ver passo 1)
      } else {
        // Se não tem disco, esse burst acabou aqui.
        p.currentBurst++;
        if (p.currentBurst < p.bursts.length) {
          p.remainingCpu = p.bursts[p.currentBurst].cpu;
          p.state = "ready";
          this.cpuQueue.add(p);
        } else {
          p.state = "terminated";
          p.finishTime = this.time;
        }
      }
      this.currentProcessCPU = null;
    }
  } else {
    this.timeline.push({
      time: this.time,
      cpuProcessId: null,
      diskProcessId: currentDiskProcess ? currentDiskProcess.id : null
    });
  }

  this.processes.forEach(p => {
    if (p.state === "ready" && p !== this.currentProcessCPU) p.waitingTime++;
  });

  this.time++;
}; 
}