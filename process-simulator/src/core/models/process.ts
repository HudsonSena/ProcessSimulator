// /core/models/process.ts

export type ProcessState =
  | "ready"
  | "running"
  | "waiting"
  | "terminated";

export interface Process {
  id: number;
  name: string;

  cpuTime: number;        // tempo total de CPU
  remainingCpu: number;

  ioTime: number;         // tempo de disco
  remainingIo: number;

  cycles: number;         // quantas vezes precisa rodar
  currentCycle: number;

  state: ProcessState;

  arrivalTime: number;

  // métricas
  waitingTime: number;
  responseTime?: number;
  startTime?: number;
  finishTime?: number;
}