"use client";

import { useSimulator } from "@/hooks/useSimulator";
import { Process } from "@/core/models/process";
import { useState } from "react";

export default function Page() {
  const initialProcesses: Process[] = [];

  const {
    processes,
    cpuUsage,
    finished,
    avgWaiting,
    timeline,
    isRunning,
    setIsRunning,
    speed,
    setSpeed,
    addProcess,
    reset // 🔥 precisa expor isso no hook
  } = useSimulator({
    quantum: 2,
    totalTime: 100,
    processes: initialProcesses,
  });

  const [form, setForm] = useState({
    name: "",
    cpuTime: 0,
    ioTime: 0,
    cycles: 1,
  });

  const getProcessName = (id: number | null) => {
  if (id === null) return "-";

  const process = processes.find((p) => p.id === id);
  return process ? process.name : id;
};

  const getColor = (id: number | null) => {
    if (id === null) return "bg-gray-600";

    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
    ];

    return colors[id % colors.length];
  };

  // 🔥 GANTT AGRUPADO (blocos contínuos)
  const groupedTimeline = [] as {
    processId: number | null;
    duration: number;
  }[];

  timeline.forEach((t) => {
    const last = groupedTimeline[groupedTimeline.length - 1];

    if (!last || last.processId !== t.processId) {
      groupedTimeline.push({ processId: t.processId, duration: 1 });
    } else {
      last.duration++;
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 grid grid-cols-3 gap-4">
      {/* CONTROLES */}
      <div className="col-span-3 flex gap-4">
        <button
          onClick={() => setIsRunning(true)}
          className="bg-green-600 px-4 py-2 rounded"
        >
          ▶ Play
        </button>

        <button
          onClick={() => setIsRunning(false)}
          className="bg-red-600 px-4 py-2 rounded"
        >
          ⏸ Pause
        </button>

        <button
          onClick={reset}
          className="bg-yellow-600 px-4 py-2 rounded"
        >
          🔄 Reset
        </button>

        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="bg-gray-700 px-2 rounded"
        >
          <option value={1000}>1x</option>
          <option value={500}>2x</option>
          <option value={200}>5x</option>
        </select>
      </div>

      {/* MÉTRICAS */}
      <div className="bg-gray-800 p-4 rounded-2xl col-span-3 grid grid-cols-4 gap-4">
        <div>
          <p className="text-gray-400">CPU (%)</p>
          <p className="text-xl">{cpuUsage.toFixed(1)}%</p>
        </div>

        <div>
          <p className="text-gray-400">Finalizados</p>
          <p className="text-xl">{finished}</p>
        </div>

        <div>
          <p className="text-gray-400">Tempo Médio Espera</p>
          <p className="text-xl">{avgWaiting.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-gray-400">Tempo Atual</p>
          <p className="text-xl">{timeline.length}</p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-gray-800 p-4 rounded-2xl col-span-3">
        <h2 className="text-xl mb-4">Adicionar Processo</h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            value={form.name}
          />
          <input
            type="number"
            placeholder="CPU"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded"
            onChange={(e) =>
              setForm({ ...form, cpuTime: Number(e.target.value) })
            }
            value={form.cpuTime || ""}
          />
          <input
            type="number"
            placeholder="Disco"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded"
            onChange={(e) =>
              setForm({ ...form, ioTime: Number(e.target.value) })
            }
            value={form.ioTime || ""}
          />
          <input
            type="number"
            placeholder="Ciclos"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded"
            onChange={(e) =>
              setForm({ ...form, cycles: Number(e.target.value) })
            }
            value={form.cycles || ""}
          />

          <button
            onClick={() => {
              if (!form.name || form.cpuTime <= 0) return;

              addProcess({
                id: Date.now(),
                name: form.name,
                cpuTime: form.cpuTime,
                remainingCpu: form.cpuTime,
                ioTime: form.ioTime,
                remainingIo: 0,
                cycles: form.cycles,
                currentCycle: 0,
                state: "ready",
                arrivalTime: timeline.length,
                waitingTime: 0,
              });

              setForm({
                name: "",
                cpuTime: 0,
                ioTime: 0,
                cycles: 1 });
            }}
            className="bg-indigo-600 px-3 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="col-span-3 bg-gray-800 p-4 rounded-2xl">
        <h2 className="text-xl mb-4">Processos</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th>ID</th>
              <th>Nome</th>
              <th>Estado</th>
              <th>CPU</th>
              <th>Espera</th>
              <th>Resposta</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id} className="border-t border-gray-700">
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.state}</td>
                <td>{p.remainingCpu}</td>
                <td>{p.waitingTime}</td>
                <td>{p.responseTime ?? "-"}</td>
                <td>{p.finishTime ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-2xl col-span-3">
  <h2 className="text-xl mb-2">Fila de Prontos (Ready)</h2>

  <div className="flex gap-2">
    {processes
      .filter((p) => p.state === "ready")
      .map((p) => (
        <div
          key={p.id}
          className="bg-blue-600 px-3 py-1 rounded text-sm"
        >
          {p.name} (CPU: {p.remainingCpu})
        </div>
      ))}
  </div>
</div>

      {/* GANTT MELHORADO */}
      <div className="col-span-3 bg-gray-800 p-4 rounded-2xl">
  <h2 className="text-xl mb-4">Gráfico de Gantt</h2>

  <div className="flex overflow-x-auto items-end">
    {groupedTimeline.map((block, i) => (
      <div key={i} className="flex flex-col items-center">
        
        {/* bloco */}
        <div
          className={`${getColor(block.processId)} flex items-center justify-center text-xs border-r border-gray-900`}
          style={{
            width: `${block.duration * 30}px`,
            height: "40px",
          }}
        >
          {getProcessName(block.processId)}
        </div>

        {/* tempo */}
        <span className="text-[10px] mt-1">
          {block.duration}
        </span>
      </div>
    ))}
  </div>
</div>
    </div>
  );
}
