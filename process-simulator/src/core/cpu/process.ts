// core/cpu/process.ts

export type ProcessState =
  | "new"
  | "ready"
  | "running"
  | "waiting"
  | "terminated";

export interface Process {
  id: number;
  name: string;

  burstTime: number;       // tempo total necessário
  remainingTime: number;   // tempo restante

  arrivalTime: number;     // quando entrou no sistema
  priority?: number;

  state: ProcessState;
}