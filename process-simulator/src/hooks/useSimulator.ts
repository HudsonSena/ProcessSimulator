// /hooks/useSimulator.ts

import { useEffect, useState } from "react";
import { Simulator } from "@/core/cpu/simulator";
import { Process } from "@/core/cpu/process";

export function useSimulator() {
  const [simulator] = useState(() => new Simulator());
  const [processes, setProcesses] = useState<Process[]>([]);

  // loop da simulação
  useEffect(() => {
    const interval = setInterval(() => {
      simulator.tick();
      setProcesses([...simulator.processes]);
    }, 1000);

    return () => clearInterval(interval);
  }, [simulator]);

  // processos iniciais
  useEffect(() => {
    simulator.addProcess({
      id: 1,
      name: "Processo A",
      burstTime: 5,
      remainingTime: 5,
      arrivalTime: 0,
      state: "new",
    });

    simulator.addProcess({
      id: 2,
      name: "Processo B",
      burstTime: 3,
      remainingTime: 3,
      arrivalTime: 0,
      state: "new",
    });
  }, [simulator]);

  return { processes, simulator };
}