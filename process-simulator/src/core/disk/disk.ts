// /core/disk/disk.ts

import { Process } from "../models/process";

export class Disk {
  queue: Process[] = [];
  current: Process | null = null;

  add(process: Process) {
    process.state = "waiting";
    process.remainingIo = process.ioTime;
    this.queue.push(process);
  }

  tick() {
    const finished: Process[] = [];

    // se não tem processo no disco, pega o próximo
    if (!this.current && this.queue.length > 0) {
      this.current = this.queue.shift()!;
    }

    // executa I/O
    if (this.current) {
      this.current.remainingIo--;

      if (this.current.remainingIo <= 0) {
        this.current.state = "ready";
        finished.push(this.current);
        this.current = null;
      }
    }

    return {
      finished,
      running: this.current, // 🔥 ESSENCIAL
    };
  }
}