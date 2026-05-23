import { Process } from "../models/process";

export type SchedulingAlgorithm = "fcfs" | "sjf" | "rr" | "priority" | "multilevel";

// Quantum por nível no algoritmo Multilevel Queue
export const MULTILEVEL_QUANTUMS: [number, number, number] = [2, 4, Infinity];
// Limites de prioridade para cada nível do Multilevel Queue
// Nível 0: prioridade 1-3 (alta), Nível 1: 4-7 (média), Nível 2: 8-10 (baixa)
export const MULTILEVEL_LEVEL_LABELS = ["Alta (1–3)", "Média (4–7)", "Baixa (8–10)"];

export class Scheduler {
  algorithm: SchedulingAlgorithm;
  queue: Process[] = [];
  multiQueues: [Process[], Process[], Process[]] = [[], [], []];

  constructor(algorithm: SchedulingAlgorithm = "fcfs") {
    this.algorithm = algorithm;
  }

  getLevelForProcess(process: Process): 0 | 1 | 2 {
    const p = process.priority ?? 5;
    if (p <= 3) return 0;
    if (p <= 7) return 1;
    return 2;
  }

  add(process: Process) {
    if (process.state === "waiting") return;
    process.state = "ready";

    if (this.algorithm === "multilevel") {
      const level = this.getLevelForProcess(process);
      if (!this.multiQueues[level].includes(process)) {
        this.multiQueues[level].push(process);
      }
    } else {
      if (!this.queue.includes(process)) {
        this.queue.push(process);
      }
    }
  }

  addFirst(process: Process) {
    process.state = "ready";

    if (this.algorithm === "multilevel") {
      const level = this.getLevelForProcess(process);
      const idx = this.multiQueues[level].indexOf(process);
      if (idx > -1) this.multiQueues[level].splice(idx, 1);
      this.multiQueues[level].unshift(process);
    } else {
      const idx = this.queue.indexOf(process);
      if (idx > -1) this.queue.splice(idx, 1);
      this.queue.unshift(process);
    }
  }

  next(): Process | null {
    if (this.algorithm === "multilevel") {
      for (const q of this.multiQueues) {
        if (q.length > 0) {
          const p = q.shift()!;
          p.state = "running";
          return p;
        }
      }
      return null;
    }

    if (this.queue.length === 0) return null;

    let idx = 0;

    if (this.algorithm === "sjf") {
      idx = this.queue.reduce((best, p, i) =>
        p.remainingCpu < this.queue[best].remainingCpu ? i : best, 0);
    } else if (this.algorithm === "priority") {
      idx = this.queue.reduce((best, p, i) =>
        (p.priority ?? 5) < (this.queue[best].priority ?? 5) ? i : best, 0);
    }
    // fcfs e rr: idx = 0 (FIFO)

    const [process] = this.queue.splice(idx, 1);
    process.state = "running";
    return process;
  }

  requeue(process: Process) {
    if (process.state !== "running") return;
    process.state = "ready";
    this.addFirst(process);
  }

  // Verifica se há processo de maior prioridade aguardando (preempção)
  hasHigherPriority(current: Process): boolean {
    if (this.algorithm === "priority") {
      return this.queue.some(p => (p.priority ?? 5) < (current.priority ?? 5));
    }
    if (this.algorithm === "multilevel") {
      const currentLevel = this.getLevelForProcess(current);
      for (let i = 0; i < currentLevel; i++) {
        if (this.multiQueues[i].length > 0) return true;
      }
    }
    return false;
  }

  // Retorna o quantum efetivo para o processo atual
  getQuantumForProcess(process: Process, defaultQuantum: number): number {
    if (this.algorithm === "fcfs" || this.algorithm === "sjf") return Infinity;
    if (this.algorithm === "multilevel") {
      return MULTILEVEL_QUANTUMS[this.getLevelForProcess(process)];
    }
    return defaultQuantum;
  }
}
