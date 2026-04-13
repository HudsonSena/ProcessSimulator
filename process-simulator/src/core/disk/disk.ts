// /core/disk/disk.ts

import { Process } from "../models/process";

export class Disk {
  queue: Process[] = [];
  current: Process | null = null;

  add(process: Process) {
    // 🔒 evita duplicação
    if (this.current === process || this.queue.includes(process)) return;

    // 🔒 NÃO redefine remainingIo aqui!
    process.state = "waiting";

    this.queue.push(process);
  }

  tick() {
    const finished: Process[] = [];

    // 🔹 pega próximo processo
    if (!this.current && this.queue.length > 0) {
      this.current = this.queue.shift()!;
    }

    // 🔹 executa I/O
    if (this.current) {
      const p = this.current;

      p.remainingIo--; // 🔥 decrementa corretamente

      if (p.remainingIo <= 0) {
        finished.push(p);

        this.current = null; // 🔥 libera o disco
      }
    }

    return {
      finished,
      running: this.current,
    };
  }
}