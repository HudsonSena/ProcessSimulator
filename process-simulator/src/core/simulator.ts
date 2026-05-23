import { Scheduler, SchedulingAlgorithm } from "./cpu/scheduler";
import { Disk } from "./disk/disk";
import { Process } from "./models/process";

export class Simulator {
  cpuQueue: Scheduler;
  diskQueue = new Disk();
  currentProcessCPU: Process | null = null;
  time = 0;
  quantum: number;
  quantumCounter = 0;
  totalTime: number;
  algorithm: SchedulingAlgorithm;
  processes: Process[] = [];
  timeline: { time: number; cpuProcessId: number | null; diskProcessId: number | null }[] = [];

  constructor(quantum: number, totalTime: number, algorithm: SchedulingAlgorithm = "fcfs") {
    this.quantum = quantum;
    this.totalTime = totalTime;
    this.algorithm = algorithm;
    this.cpuQueue = new Scheduler(algorithm);
  }

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
    process.priority = process.priority ?? 5;

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

  tick = () => {
    if (this.time >= this.totalTime) return;

    // 1. DISCO: Processa E/S
    const { finished, running: currentDiskProcess } = this.diskQueue.tick();

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

    // 2. PREEMPÇÃO POR QUANTUM (RR e Multilevel)
    if (this.currentProcessCPU) {
      const effectiveQuantum = this.cpuQueue.getQuantumForProcess(this.currentProcessCPU, this.quantum);
      if (this.quantumCounter >= effectiveQuantum && this.currentProcessCPU.remainingCpu > 0) {
        const p = this.currentProcessCPU;
        p.state = "ready";
        this.cpuQueue.addFirst(p);
        this.currentProcessCPU = null;
      }
    }

    // 3. PREEMPÇÃO POR PRIORIDADE (Priority e Multilevel)
    if (
      this.currentProcessCPU &&
      (this.algorithm === "priority" || this.algorithm === "multilevel") &&
      this.cpuQueue.hasHigherPriority(this.currentProcessCPU)
    ) {
      const p = this.currentProcessCPU;
      p.state = "ready";
      this.cpuQueue.add(p);
      this.currentProcessCPU = null;
    }

    // 4. SELEÇÃO
    if (!this.currentProcessCPU) {
      this.currentProcessCPU = this.cpuQueue.next();
      this.quantumCounter = 0;
    }

    // 5. EXECUÇÃO
    if (this.currentProcessCPU) {
      const p = this.currentProcessCPU;
      p.state = "running";

      if (p.startTime === undefined) {
        p.startTime = this.time;
        p.responseTime = this.time - p.arrivalTime;
      }

      p.remainingCpu--;
      this.quantumCounter++;

      this.timeline.push({
        time: this.time,
        cpuProcessId: p.id,
        diskProcessId: currentDiskProcess ? currentDiskProcess.id : null,
      });

      // 6. TÉRMINO DO BURST DE CPU
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
    } else {
      this.timeline.push({
        time: this.time,
        cpuProcessId: null,
        diskProcessId: currentDiskProcess ? currentDiskProcess.id : null,
      });
    }

    this.processes.forEach(p => {
      if (p.state === "ready") p.waitingTime++;
    });

    this.time++;
  };
}
