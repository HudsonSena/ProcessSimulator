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

  totalTime: number;

  processes: Process[] = [];
  timeline: { time: number; processId: number | null; type: "cpu" | "io" }[] =
    [];

  constructor(quantum: number, totalTime: number) {
    this.quantum = quantum;
    this.totalTime = totalTime;
  }

  addProcess(process: Process) {
    this.processes.push(process);
    this.scheduler.add(process);
  }

  tick() {
    if (this.time >= this.totalTime) return;

    // 🔹 DISCO (E/S)
    const { finished, running } = this.disk.tick();

    // processos que terminaram I/O voltam pra fila
    finished.forEach((p) => this.scheduler.add(p));

    // voltou do disco
    finished.forEach((p) => this.scheduler.add(p));

    // 🔥 REGISTRA DISCO
    this.timeline.push({
      time: this.time,
      processId: running ? running.id : null,
      type: "io",
    });

    // 🔹 CPU livre
    if (!this.currentProcess) {
      this.currentProcess = this.scheduler.next();
      this.quantumCounter = 0;

      if (
        this.currentProcess &&
        this.currentProcess.responseTime === undefined
      ) {
        this.currentProcess.responseTime = this.time;
      }
    }

    // 🔹 EXECUÇÃO
    if (this.currentProcess) {
      const p = this.currentProcess;

      p.state = "running";
      p.remainingCpu--;
      this.quantumCounter++;

      this.timeline.push({ time: this.time, processId: p.id, type: "cpu" });

      // terminou CPU do ciclo
      if (p.remainingCpu <= 0) {
        p.currentCycle++;

        if (p.ioTime > 0) {
          this.disk.add(p);
          p.remainingIo = p.ioTime;
        } else {
          p.currentCycle++;

          if (p.currentCycle >= p.cycles) {
            p.state = "terminated";
            p.finishTime = this.time;
          } else {
            p.remainingCpu = p.cpuTime;
            this.scheduler.add(p);
          }
        }

        this.currentProcess = null;
      }

      // quantum estourou
      else if (this.quantumCounter >= this.quantum) {
        this.scheduler.requeue(p);
        this.currentProcess = null;
      }
    } else {
      this.timeline.push({ time: this.time, processId: null, type: "cpu" });
    }

    // 🔹 tempo de espera
    this.scheduler.queue.forEach((p) => p.waitingTime++);

    this.time++;
  }

  // 📊 MÉTRICAS
  getCPUUsage() {
    const active = this.timeline.filter((t) => t.processId !== null).length;
    return (active / this.timeline.length) * 100;
  }

  getFinishedCount() {
    return this.processes.filter((p) => p.state === "terminated").length;
  }

  getAverageWaitingTime() {
    const total = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
    return total / this.processes.length;
  }
}
