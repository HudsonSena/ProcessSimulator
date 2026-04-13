// /core/simulator.ts

import { Scheduler } from "./cpu/scheduler";
import { Disk } from "./disk/disk";
import { Process } from "./models/process";

export class Simulator {
  scheduler = new Scheduler();
  disk = new Disk();

  currentProcess: Process | null = null;

  time = 0;
  quantum: number;
  quantumCounter = 0;

  currentGlobalCycle = 0;

  totalTime: number;

  processes: Process[] = [];
  timeline: { time: number; processId: number | null; type: "cpu" | "io" }[] =
    [];

  constructor(quantum: number, totalTime: number) {
    this.quantum = quantum;
    this.totalTime = totalTime;
  }

  // 🔥 só avança ciclo quando TODOS terminaram o atual
  canAdvanceCycle() {
    return this.processes.every(
      (p) =>
        p.currentBurst > this.currentGlobalCycle ||
        p.state === "terminated"
    );
  }

  addProcess(process: Process) {
    const existing = this.processes.find((p) => p.name === process.name);

    if (existing) {
      existing.bursts.push({
        cpu: process.bursts[0].cpu,
        io: process.bursts[0].io,
      });
      return;
    }

    this.processes.push(process);
    this.scheduler.add(process);
  }

 tick() {
  if (this.time >= this.totalTime) return;

  // 🔹 DISCO (E/S)
  const { finished, running } = this.disk.tick();

  // 🔥 processos que terminaram IO
  finished.forEach((p) => {
    p.currentBurst++;

    if (p.currentBurst >= p.bursts.length) {
      p.state = "terminated";
      p.finishTime = this.time;
    } else {
      const next = p.bursts[p.currentBurst];

      p.remainingCpu = next.cpu;
      p.state = "ready";

      // 🔒 só entra se estiver no ciclo permitido
      if (p.currentBurst <= this.currentGlobalCycle) {
        this.scheduler.add(p);
      }
    }
  });

  // 🔥 REGISTRA DISCO
  this.timeline.push({
    time: this.time,
    processId: running ? running.id : null,
    type: "io",
  });

  // 🔹 CPU livre
  if (!this.currentProcess) {
    let next = this.scheduler.next();

    // 🔒 bloqueia ciclos futuros
    while (next && next.currentBurst > this.currentGlobalCycle) {
      this.scheduler.add(next);
      next = this.scheduler.next();
    }

    this.currentProcess = next;
    this.quantumCounter = 0;

    if (
      this.currentProcess &&
      this.currentProcess.responseTime === undefined
    ) {
      this.currentProcess.responseTime = this.time;
    }
  }

  // 🔹 EXECUÇÃO CPU
  if (this.currentProcess) {
    const p = this.currentProcess;

    p.state = "running";

    const burst = p.bursts[p.currentBurst] ?? { cpu: 0, io: 0 };
    console.log("BURST:", burst);

    p.remainingCpu--;
    this.quantumCounter++;

    this.timeline.push({
      time: this.time,
      processId: p.id,
      type: "cpu",
    });

    // 🔥 terminou CPU
    if (p.remainingCpu <= 0) {
      if (burst.io > 0) {
        console.log("ENVIANDO PARA O DISCO:", p.name);
        // 🔥 CORRETO
        p.remainingIo = burst.io;
        p.state = "waiting";
        this.disk.add(p);
      } else {
        p.currentBurst++;

        if (p.currentBurst >= p.bursts.length) {
          p.state = "terminated";
          p.finishTime = this.time;
        } else {
          const nextBurst = p.bursts[p.currentBurst];
          p.remainingCpu = nextBurst.cpu;

          if (p.currentBurst <= this.currentGlobalCycle) {
            p.state = "ready";
            this.scheduler.add(p);
          }
        }
      }

      this.currentProcess = null;
    }

    // 🔹 quantum
    else if (this.quantumCounter >= this.quantum) {
      this.scheduler.requeue(p);
      this.currentProcess = null;
    }
  } else {
    this.timeline.push({
      time: this.time,
      processId: null,
      type: "cpu",
    });
  }

  // 🔹 tempo de espera
  this.scheduler.queue.forEach((p) => p.waitingTime++);

  this.time++;

  // 🔥 avanço global de ciclo
  if (this.canAdvanceCycle()) {
    this.currentGlobalCycle++;

    // 🔥 desbloqueia próximos ciclos
    this.processes.forEach((p) => {
      if (
        p.state === "ready" &&
        p.currentBurst === this.currentGlobalCycle
      ) {
        this.scheduler.add(p);
      }
    });
  }
}

  // 📊 MÉTRICAS
  getCPUUsage() {
    const cpuTimeline = this.timeline.filter((t) => t.type === "cpu");
    const active = cpuTimeline.filter((t) => t.processId !== null).length;
    return (active / cpuTimeline.length) * 100;
  }

  getFinishedCount() {
    return this.processes.filter((p) => p.state === "terminated").length;
  }

  getAverageWaitingTime() {
    const total = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
    return total / this.processes.length;
  }
}