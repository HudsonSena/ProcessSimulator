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

  bursts: Burst[]; // 🔥 lista de ciclos (CPU + IO)

  currentBurst: number; // 🔥 índice do ciclo atual

  remainingCpu: number;
  remainingIo: number;

  state: ProcessState;

  arrivalTime: number;

  // métricas
  waitingTime: number;
  responseTime?: number;
  startTime?: number;
  finishTime?: number;
}