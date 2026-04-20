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

  // 1. Processamento do Disco (I/O)
  const { finished, running: currentDiskProcess } = this.diskQueue.tick();

  // Processos saindo do Disco -> Fim da fila da CPU
  finished.forEach((p) => {
    p.currentBurst++;
    if (p.currentBurst < p.bursts.length) {
      p.remainingCpu = p.bursts[p.currentBurst].cpu;
      p.state = "ready";
      this.cpuQueue.add(p); 
    } else {
      p.state = "terminated";
      p.finishTime = this.time;
    }
  });

  // 2. Verificação de Preempção (Quantum) do tick anterior
  // Se o quantum acabou, o processo que estava na CPU já foi para a fila 
  // via addFirst/requeue no tick passado. Garantimos que a CPU esteja livre.
  if (this.currentProcessCPU && this.quantumCounter >= this.quantum) {
    const p = this.currentProcessCPU;
    if (p.remainingCpu > 0) {
      p.state = "ready";
      this.cpuQueue.addFirst(p); // Devolve para o início da fila (Prioridade)
    }
    this.currentProcessCPU = null;
  }

  // 3. Seleção do Processo para este tick
  if (!this.currentProcessCPU) {
    this.currentProcessCPU = this.cpuQueue.next();
    this.quantumCounter = 0;
  }

  // 4. Execução
  if (this.currentProcessCPU) {
    const p = this.currentProcessCPU;
    p.state = "running";
    p.remainingCpu--;
    this.quantumCounter++;

    // Registro na timeline
    this.timeline.push({
      time: this.time,
      cpuProcessId: p.id,
      diskProcessId: currentDiskProcess ? currentDiskProcess.id : null
    });

    // Se o burst de CPU acabou NESTE tick
    if (p.remainingCpu <= 0) {
      const burstData = p.bursts[p.currentBurst];
      if (burstData && burstData.io > 0) {
        p.remainingIo = burstData.io;
        p.state = "waiting";
        this.diskQueue.add(p);
      } else {
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
    // Caso o Quantum acabe, NÃO limpamos aqui. Limpamos no INÍCIO do próximo tick.
    // Isso garante que o registro na timeline seja feito corretamente.
  } else {
    this.timeline.push({
      time: this.time,
      cpuProcessId: null,
      diskProcessId: currentDiskProcess ? currentDiskProcess.id : null
    });
  }

  // Contabilidade de espera
  this.processes.forEach(p => {
    if (p.state === "ready" && p !== this.currentProcessCPU) p.waitingTime++;
  });

  this.time++;
};
}