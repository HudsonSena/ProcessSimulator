export type ProcessState =
  | "ready"
  | "running"
  | "waiting"
  | "terminated";

export type Burst = {
  cpu: number;
  io: number;
};

export interface Process {
  id: number;
  name: string;

  bursts: Burst[];
  currentBurst: number;

  remainingCpu: number;
  remainingIo: number;

  state: ProcessState;

  arrivalTime: number;

  // 1 = maior prioridade, 10 = menor prioridade
  priority: number;

  // métricas
  waitingTime: number;
  responseTime?: number;
  startTime?: number;
  finishTime?: number;
}