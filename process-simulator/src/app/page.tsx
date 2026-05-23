"use client";

import { useSimulator } from "@/hooks/useSimulator";
import { Process } from "@/core/models/process";
import { SchedulingAlgorithm, MULTILEVEL_QUANTUMS, MULTILEVEL_LEVEL_LABELS } from "@/core/cpu/scheduler";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const ALGORITHM_LABELS: Record<SchedulingAlgorithm, string> = {
  fcfs: "FCFS — Primeiro a Chegar",
  sjf: "SJF — Menor Job Primeiro",
  rr: "RR — Round Robin",
  priority: "Priority — Por Prioridade",
  multilevel: "Multilevel — Filas Multiníveis",
};

const ALGORITHM_DESCRIPTIONS: Record<SchedulingAlgorithm, string> = {
  fcfs: "Processos são atendidos na ordem de chegada. Sem preempção.",
  sjf: "Processo com menor burst de CPU restante é atendido primeiro. Sem preempção.",
  rr: "Cada processo recebe um quantum de CPU. Ao expirar, vai para o fim da fila.",
  priority: "Processo com maior prioridade (menor número) executa primeiro. Preemptivo.",
  multilevel: "3 filas por nível de prioridade. Alta: RR q=2 | Média: RR q=4 | Baixa: FCFS.",
};

export default function Page() {
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>("fcfs");
  const [quantum, setQuantum] = useState(4);

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
    reset,
    cpuQueue,
  } = useSimulator({
    quantum,
    totalTime: 100,
    algorithm,
    processes: [],
  });

  const [form, setForm] = useState({
    name: "",
    cpuTime: 0,
    ioTime: 0,
    cycles: 1,
    priority: 5,
  });

  const getProcessName = (id: number | null) => {
    if (id === null) return "-";
    const process = processes.find((p) => p.id === id);
    return process ? process.name : String(id);
  };

  const COLORS = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
  ];

  const getColor = (id: number | null) => {
    if (id === null) return "bg-gray-600";
    return COLORS[id % COLORS.length];
  };

  const cpuGrouped = [] as { processId: number | null; duration: number }[];
  timeline.forEach((t) => {
    const last = cpuGrouped[cpuGrouped.length - 1];
    if (!last || last.processId !== t.cpuProcessId) {
      cpuGrouped.push({ processId: t.cpuProcessId, duration: 1 });
    } else {
      last.duration++;
    }
  });

  const diskGrouped = [] as { processId: number | null; duration: number }[];
  timeline.forEach((t) => {
    const last = diskGrouped[diskGrouped.length - 1];
    if (!last || last.processId !== t.diskProcessId) {
      diskGrouped.push({ processId: t.diskProcessId, duration: 1 });
    } else {
      last.duration++;
    }
  });

  const handleReset = () => {
    reset();
  };

  const handleChangeAlgorithm = (value: string) => {
    setAlgorithm(value as SchedulingAlgorithm);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col gap-4">

      {/* CONFIGURAÇÃO */}
      <div className="bg-gray-800 p-4 rounded-2xl flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-200">Configuração do Simulador</h2>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Seletor de algoritmo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Algoritmo</label>
            <Select onValueChange={handleChangeAlgorithm} value={algorithm}>
              <SelectTrigger className="w-64 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="bg-gray-700">
                  <SelectLabel className="text-gray-300">Algoritmo de Escalonamento</SelectLabel>
                  {(Object.keys(ALGORITHM_LABELS) as SchedulingAlgorithm[]).map((alg) => (
                    <SelectItem key={alg} value={alg}>
                      {ALGORITHM_LABELS[alg]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Quantum — só visível para RR */}
          {algorithm === "rr" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Quantum</label>
              <Input
                type="number"
                value={quantum}
                onChange={(e) => setQuantum(Math.max(1, Number(e.target.value)))}
                className="w-24 text-white border-gray-600 bg-gray-700"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 italic">{ALGORITHM_DESCRIPTIONS[algorithm]}</p>
      </div>

      {/* CONTROLES */}
      <div className="flex gap-4 flex-wrap">
        <Button onClick={() => setIsRunning(true)} className="bg-green-600 px-4 py-2 rounded">
          Play
        </Button>
        <Button onClick={() => setIsRunning(false)} className="bg-red-600 px-4 py-2 rounded">
          Pause
        </Button>
        <Button onClick={handleReset} className="bg-blue-600 px-4 py-2 rounded">
          Reset
        </Button>
        <Select onValueChange={(value) => setSpeed(Number(value))} value={String(speed)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Velocidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup className="bg-gray-700">
              <SelectLabel>Velocidade</SelectLabel>
              <SelectItem value="1000">1x</SelectItem>
              <SelectItem value="500">2x</SelectItem>
              <SelectItem value="200">5x</SelectItem>
              <SelectItem value="50">20x</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* MÉTRICAS */}
      <div className="bg-gray-800 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-400 text-sm">CPU (%)</p>
          <p className="text-xl">{cpuUsage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Finalizados</p>
          <p className="text-xl">{finished}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Espera Média</p>
          <p className="text-xl">{avgWaiting.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Tempo Atual</p>
          <p className="text-xl">{timeline.length}</p>
        </div>
      </div>

      {/* FORM — ADICIONAR PROCESSO */}
      <div className="bg-gray-800 p-4 rounded-2xl">
        <h2 className="text-xl mb-4">Adicionar Processo</h2>
        <div className="flex gap-2 flex-wrap">
          <Input
            type="text"
            placeholder="Nome"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded w-28"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            value={form.name}
          />
          <Input
            type="number"
            placeholder="CPU"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded w-24"
            onChange={(e) => setForm({ ...form, cpuTime: Number(e.target.value) })}
            value={form.cpuTime || ""}
          />
          <Input
            type="number"
            placeholder="Disco"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded w-24"
            onChange={(e) => setForm({ ...form, ioTime: Number(e.target.value) })}
            value={form.ioTime || ""}
          />
          <Input
            type="number"
            placeholder="Ciclos"
            className="text-white px-2 placeholder:text-white border-2 border-gray-700 rounded w-24"
            onChange={(e) => setForm({ ...form, cycles: Number(e.target.value) })}
            value={form.cycles || ""}
          />
          {/* Prioridade — visível para priority e multilevel */}
          {(algorithm === "priority" || algorithm === "multilevel") && (
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 mb-0.5">Prioridade (1–10)</label>
              <Input
                type="number"
                min={1}
                max={10}
                placeholder="1–10"
                className="text-white px-2 placeholder:text-white border-2 border-yellow-600 rounded w-28"
                onChange={(e) =>
                  setForm({ ...form, priority: Math.min(10, Math.max(1, Number(e.target.value))) })
                }
                value={form.priority}
              />
            </div>
          )}
          <Button
            onClick={() => {
              if (!form.name || form.cpuTime <= 0) return;

              const bursts = Array.from({ length: form.cycles }, () => ({
                cpu: form.cpuTime,
                io: form.ioTime,
              }));

              addProcess({
                id: Date.now(),
                name: form.name,
                bursts,
                currentBurst: 0,
                remainingCpu: bursts[0].cpu,
                remainingIo: 0,
                state: "ready",
                arrivalTime: timeline.length,
                priority: form.priority,
                waitingTime: 0,
              });

              setForm({ name: "", cpuTime: 0, ioTime: 0, cycles: 1, priority: 5 });
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {/* TABELA DE PROCESSOS */}
      <div className="bg-gray-800 p-4 rounded-2xl overflow-x-auto">
        <h2 className="text-xl mb-4">Processos</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="pr-4">Nome</th>
              <th className="pr-4">Estado</th>
              {(algorithm === "priority" || algorithm === "multilevel") && (
                <th className="pr-4">Prior.</th>
              )}
              <th className="pr-4">CPU Rest.</th>
              <th className="pr-4">Disco Rest.</th>
              <th className="pr-4">Espera</th>
              <th className="pr-4">Resposta</th>
              <th className="pr-4">Fim</th>
              <th className="pr-4">Burst CPU</th>
              <th className="pr-4">Burst Disco</th>
              <th>Ciclos</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id} className="border-t border-gray-700">
                <td className="pr-4 flex items-center gap-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${getColor(p.id)}`} />
                  {p.name}
                </td>
                <td className="pr-4">
                  <span className={
                    p.state === "running" ? "text-green-400" :
                    p.state === "ready" ? "text-blue-400" :
                    p.state === "waiting" ? "text-yellow-400" :
                    "text-gray-400"
                  }>
                    {p.state}
                  </span>
                </td>
                {(algorithm === "priority" || algorithm === "multilevel") && (
                  <td className="pr-4 font-bold text-yellow-300">{p.priority}</td>
                )}
                <td className="pr-4">{p.remainingCpu}</td>
                <td className="pr-4">{p.remainingIo}</td>
                <td className="pr-4">{p.waitingTime}</td>
                <td className="pr-4">{p.responseTime ?? "-"}</td>
                <td className="pr-4">{p.finishTime ?? "-"}</td>
                <td className="pr-4">{p.bursts.map((b) => b.cpu).join(" | ")}</td>
                <td className="pr-4">{p.bursts.map((b) => b.io).join(" | ")}</td>
                <td>{p.bursts.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FILAS DE ESPERA */}
      {algorithm === "multilevel" ? (
        // Multilevel: exibe 3 filas separadas por nível
        <div className="flex flex-col gap-3">
          <h2 className="text-xl">Filas Multiníveis</h2>
          {cpuQueue.multiQueues.map((queue, level) => (
            <div
              key={level}
              className={`bg-gray-800 p-4 rounded-2xl border ${
                level === 0 ? "border-red-500/40" :
                level === 1 ? "border-yellow-500/40" :
                "border-green-500/40"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`font-semibold ${
                  level === 0 ? "text-red-400" :
                  level === 1 ? "text-yellow-400" :
                  "text-green-400"
                }`}>
                  Nível {level} — Prioridade {MULTILEVEL_LEVEL_LABELS[level]}
                </h3>
                <span className="text-xs text-gray-500">
                  {MULTILEVEL_QUANTUMS[level] === Infinity ? "FCFS" : `RR Quantum=${MULTILEVEL_QUANTUMS[level]}`}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap min-h-[36px]">
                {queue.map((p) => (
                  <div
                    key={p.id}
                    className={`px-3 py-1 rounded text-sm ${
                      level === 0 ? "bg-red-700" :
                      level === 1 ? "bg-yellow-700" :
                      "bg-green-700"
                    }`}
                  >
                    {p.name}
                    <span className="text-[10px] opacity-70 ml-1">(CPU: {p.remainingCpu})</span>
                  </div>
                ))}
                {queue.length === 0 && (
                  <span className="text-gray-500 text-sm italic">Fila vazia</span>
                )}
              </div>
            </div>
          ))}
          {/* Processo em execução */}
          <div className="bg-gray-800 p-4 rounded-2xl border border-blue-500/40">
            <h3 className="text-blue-400 font-semibold mb-2">Em Execução (CPU)</h3>
            <div className="flex gap-2 flex-wrap min-h-[36px]">
              {processes.filter(p => p.state === "running").map(p => (
                <div key={p.id} className="bg-blue-600 px-3 py-1 rounded text-sm animate-pulse">
                  {p.name} <span className="text-[10px] opacity-70">(CPU: {p.remainingCpu})</span>
                </div>
              ))}
              {processes.filter(p => p.state === "running").length === 0 && (
                <span className="text-gray-500 text-sm italic">CPU ociosa</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Algoritmos simples: fila única de CPU + fila de disco
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-2xl border border-blue-500/30">
            <h2 className="text-xl mb-2 text-blue-400">Fila de Espera: CPU</h2>
            <div className="flex gap-2 flex-wrap min-h-[40px]">
              {processes.filter((p) => p.state === "ready").map((p) => (
                <div key={p.id} className="bg-blue-600 px-3 py-1 rounded text-sm animate-pulse">
                  {p.name}
                  {algorithm === "priority" && (
                    <span className="text-[10px] opacity-70 ml-1">(P:{p.priority})</span>
                  )}
                  <span className="text-[10px] opacity-70 ml-1">(CPU: {p.remainingCpu})</span>
                </div>
              ))}
              {processes.filter(p => p.state === "ready").length === 0 &&
                <span className="text-gray-500 text-sm italic">Fila vazia</span>}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-2xl border border-green-500/30">
            <h2 className="text-xl mb-2 text-green-400">Fila de Espera: Disco</h2>
            <div className="flex gap-2 flex-wrap min-h-[40px]">
              {processes.filter((p) => p.state === "waiting").map((p) => (
                <div key={p.id} className="bg-green-600 px-3 py-1 rounded text-sm">
                  {p.name} <span className="text-[10px] opacity-70">(IO: {p.remainingIo})</span>
                </div>
              ))}
              {processes.filter(p => p.state === "waiting").length === 0 &&
                <span className="text-gray-500 text-sm italic">Sem processos em I/O</span>}
            </div>
          </div>
        </div>
      )}

      {/* GRÁFICO GANTT: CPU */}
      <div className="bg-gray-800 p-4 rounded-2xl">
        <h2 className="text-xl mb-4 border-l-4 border-blue-500 pl-2">Gantt — CPU</h2>
        <div className="flex overflow-x-auto pb-4">
          {cpuGrouped.map((block, i) => (
            <div key={i} className="flex flex-col items-center flex-shrink-0">
              <div
                className={`${getColor(block.processId)} flex items-center justify-center text-xs border-r border-gray-900 transition-all`}
                style={{ width: `${Math.max(block.duration * 20, 30)}px`, height: "40px" }}
              >
                {getProcessName(block.processId)}
              </div>
              <span className="text-[9px] mt-1 text-gray-400">{block.duration}s</span>
            </div>
          ))}
        </div>
      </div>

      {/* GRÁFICO GANTT: DISCO */}
      <div className="bg-gray-800 p-4 rounded-2xl">
        <h2 className="text-xl mb-4 border-l-4 border-green-500 pl-2">Gantt — Disco</h2>
        <div className="flex overflow-x-auto pb-4">
          {diskGrouped.map((block, i) => (
            <div key={i} className="flex flex-col items-center flex-shrink-0">
              <div
                className={`${getColor(block.processId)} flex items-center justify-center text-xs border-r border-gray-900 transition-all`}
                style={{ width: `${Math.max(block.duration * 20, 30)}px`, height: "40px" }}
              >
                {getProcessName(block.processId)}
              </div>
              <span className="text-[9px] mt-1 text-gray-400">{block.duration}s</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
