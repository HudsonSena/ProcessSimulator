// /hooks/useSimulator.ts

import { useEffect, useState, useCallback } from "react";
import { Simulator } from "@/core/simulator";
import { Process } from "@/core/models/process";

// Definimos o que o Simulator deve ter para que o TS não reclame
interface ISimulator {
  time: number;
  processes: Process[];
  timeline: TimelineItem[];
  tick: () => void;
  addProcess: (p: Process) => void;
  getCPUUsage: () => number;
  getDiskUsage: () => number;
  getFinishedCount: () => number;
  getAverageWaitingTime: () => number;
}

type TimelineItem = {
  time: number;
  cpuProcessId: number | null;
  diskProcessId: number | null;
};

type SimulatorState = {
  processes: Process[];
  cpuUsage: number;
  diskUsage: number;
  finished: number;
  avgWaiting: number;
  timeline: TimelineItem[];
};

export function useSimulator(config: {
  quantum: number;
  totalTime: number;
  processes: Process[];
}) {
  // Tipamos explicitamente a instância
  const [simulator, setSimulator] = useState<ISimulator>(() => {
    const sim = new Simulator(config.quantum, config.totalTime);
    config.processes.forEach((p) => sim.addProcess(p));
    return sim as unknown as ISimulator;
  });

  const [state, setState] = useState<SimulatorState>(() => ({
    processes: [...simulator.processes],
    cpuUsage: 0,
    diskUsage: 0,
    finished: 0,
    avgWaiting: 0,
    timeline: [],
  }));

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500);

  const addProcess = useCallback((process: Process) => {
    simulator.addProcess(process);
    setState((prev) => ({
      ...prev,
      processes: [...simulator.processes],
    }));
  }, [simulator]);

  const reset = useCallback(() => {
    setIsRunning(false);
    const newSim = new Simulator(config.quantum, config.totalTime);
    config.processes.forEach((p) => newSim.addProcess(p));
    
    setSimulator(newSim as unknown as ISimulator);
    setState({
      processes: [...newSim.processes],
      cpuUsage: 0,
      diskUsage: 0,
      finished: 0,
      avgWaiting: 0,
      timeline: [],
    });
  }, [config.quantum, config.totalTime, config.processes]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (simulator.time >= config.totalTime) {
        setIsRunning(false);
        return;
      }

      simulator.tick();

      setState({
        processes: [...simulator.processes],
        cpuUsage: simulator.getCPUUsage(),
        diskUsage: simulator.getDiskUsage(),
        finished: simulator.getFinishedCount(),
        avgWaiting: simulator.getAverageWaitingTime(),
        timeline: [...simulator.timeline],
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isRunning, speed, simulator, config.totalTime]);

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