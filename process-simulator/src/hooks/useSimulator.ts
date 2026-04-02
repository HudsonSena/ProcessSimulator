// /hooks/useSimulator.ts

import { useEffect, useRef, useState } from "react";
import { Simulator } from "@/core/simulator";
import { Process } from "@/core/models/process";

type TimelineItem = {
  time: number;
  processId: number | null;
};

type SimulatorState = {
  processes: Process[];
  cpuUsage: number;
  finished: number;
  avgWaiting: number;
  timeline: TimelineItem[];
};

export function useSimulator(config: {
  quantum: number;
  totalTime: number;
  processes: Process[];
}) {
  const simulatorRef = useRef<Simulator | null>(null);

  // ✅ inicialização segura (apenas uma vez)
  if (!simulatorRef.current) {
    simulatorRef.current = new Simulator(
      config.quantum,
      config.totalTime
    );
  }

  // ✅ garante que não é null
  const simulator = simulatorRef.current!;

  const [state, setState] = useState<SimulatorState>({
    processes: [],
    cpuUsage: 0,
    finished: 0,
    avgWaiting: 0,
    timeline: [],
  });

  // ✅ adiciona processos apenas uma vez
  useEffect(() => {
    config.processes.forEach((p) => simulator.addProcess(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500);
  
  const addProcess = (process: Process) => {
  simulator.addProcess(process);
  setState((prev) => ({
    ...prev,
    processes: [...prev.processes, process],
  }));
  };

  const reset = () => {
  simulatorRef.current = new Simulator(
    config.quantum,
    config.totalTime
  );

  setState({
    processes: [],
    cpuUsage: 0,
    finished: 0,
    avgWaiting: 0,
    timeline: [],
  });

  setIsRunning(false);
};
  
  // ✅ loop da simulação
  useEffect(() => {
  if (!isRunning) return;

  const interval = setInterval(() => {
    simulator.tick();

    setState({
      processes: [...simulator.processes],
      cpuUsage: simulator.getCPUUsage(),
      finished: simulator.getFinishedCount(),
      avgWaiting: simulator.getAverageWaitingTime(),
      timeline: [...simulator.timeline],
    });
  }, speed);

  return () => clearInterval(interval);
}, [isRunning, speed, simulator]);

  return {
  ...state,
  isRunning,
  setIsRunning,
  speed,
  setSpeed,
  addProcess,
  reset,
};
}