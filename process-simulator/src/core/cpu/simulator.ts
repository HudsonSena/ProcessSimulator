// core/cpu/simulator.ts

import { CPU } from "./cpu";
import { Scheduler } from "./scheduler";
import { Process } from "./process";

export class Simulator {
  cpu: CPU;
  scheduler: Scheduler;
  processes: Process[] = [];

  constructor() {
    this.cpu = new CPU();
    this.scheduler = new Scheduler(2);
  }

  addProcess(process: Process) {
    this.processes.push(process);
    this.scheduler.addProcess(process);
  }

  tick() {
    // se CPU estiver livre, pega próximo processo
    if (this.cpu.isIdle()) {
      const next = this.scheduler.getNextProcess();
      if (next) {
        this.cpu.assignProcess(next);
      }
    }

    // executa processo atual
    this.cpu.execute();

    // controle do quantum (Round Robin)
    if (this.cpu.currentProcess) {
      const next = this.scheduler.tick(this.cpu.currentProcess);

      if (next !== this.cpu.currentProcess) {
        this.cpu.assignProcess(next!);
      }
    }
  }
}