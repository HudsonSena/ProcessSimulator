import { Process } from "../models/process";

export class Scheduler {
  queue: Process[] = [];

  add(process: Process) {
    if (process.state === "waiting") return;

    // 🚨 evita duplicação na fila
    if (this.queue.includes(process)) return;

    process.state = "ready";
    this.queue.push(process);
  }

  next(): Process | null {
  if (this.queue.length === 0) return null;

  // 🔥 PRIORIDADE: maior currentBurst primeiro
  this.queue.sort((a, b) => {
    if (b.currentBurst !== a.currentBurst) {
        return b.currentBurst - a.currentBurst;
      }

      // 🔹 desempate: quem chegou antes
      return a.arrivalTime - b.arrivalTime;
    });

  const process = this.queue.shift() || null;

  if (process) {
      process.state = "running";
    }

    return process;
  }

  requeue(process: Process) {
    // 🔒 só re-enfileira se ainda estiver válido
    if (process.state !== "running") return;

    process.state = "ready";

    // 🔒 evita duplicação
    if (!this.queue.includes(process)) {
      this.queue.push(process);
    }
  }
}