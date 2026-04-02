// /core/disk/disk.ts

import { Process } from "../models/process";

export class Disk {
  queue: Process[] = [];

  add(process: Process) {
    process.state = "waiting";
    process.remainingIo = process.ioTime;
    this.queue.push(process);
  }

  tick(): Process[] {
    const finished: Process[] = [];

    this.queue.forEach((p) => {
      p.remainingIo--;

      if (p.remainingIo <= 0) {
        finished.push(p);
      }
    });

    this.queue = this.queue.filter((p) => p.remainingIo > 0);

    return finished;
  }
}