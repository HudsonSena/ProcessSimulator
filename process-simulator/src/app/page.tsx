'use client';
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [processes, setProcesses] = useState([
    { id: 1, name: "Processo A", state: "running", remaining: 3, priority: 2 },
    { id: 2, name: "Processo B", state: "ready", remaining: 4, priority: 1 },
    { id: 3, name: "Processo C", state: "waiting", remaining: 5, priority: 3 },
    { id: 4, name: "Processo D", state: "terminated", remaining: 0, priority: 2 },
  ]);

  const [cpuUsage, setCpuUsage] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(45);
  const [logs, setLogs] = useState([
    "[10:01:02] Processo A iniciado",
    "[10:01:05] Processo B adicionado à fila",
    "[10:01:08] Troca de contexto A -> B",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => (prev + Math.random() * 10 - 5));
      setMemoryUsage((prev) => (prev + Math.random() * 10 - 5));

      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Tick executado`,
        ...prev.slice(0, 4),
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 grid grid-cols-3 gap-4">
      {/* Processos */}
      <div className="col-span-2 bg-gray-800 p-4 rounded-2xl shadow">
        <h2 className="text-xl mb-4">Processos</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th>ID</th>
              <th>Nome</th>
              <th>Estado</th>
              <th>Tempo</th>
              <th>Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id} className="border-t border-gray-700">
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td className="capitalize">{p.state}</td>
                <td>{p.remaining}</td>
                <td>{p.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CPU */}
      <div className="bg-gray-800 p-4 rounded-2xl shadow">
        <h2 className="text-xl mb-2">CPU</h2>
        <div className="w-full bg-gray-700 rounded-full h-6">
          <div
            className="bg-green-500 h-6 rounded-full"
            style={{ width: `${cpuUsage}%` }}
          />
        </div>
        <p className="mt-2">{cpuUsage}%</p>
      </div>

      {/* Memória */}
      <div className="bg-gray-800 p-4 rounded-2xl shadow">
        <h2 className="text-xl mb-2">Memória</h2>
        <div className="w-full bg-gray-700 rounded-full h-6">
          <div
            className="bg-blue-500 h-6 rounded-full"
            style={{ width: `${memoryUsage}%` }}
          />
        </div>
        <p className="mt-2">{memoryUsage}%</p>
      </div>

      {/* Timeline */}
      <div className="col-span-2 bg-gray-800 p-4 rounded-2xl shadow">
        <h2 className="text-xl mb-4">Linha do Tempo</h2>
        <div className="flex gap-2">
          {processes.map((p) => (
            <div
              key={p.id}
              className="px-4 py-2 rounded bg-indigo-500"
            >
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-gray-800 p-4 rounded-2xl shadow">
        <h2 className="text-xl mb-4">Logs</h2>
        <div className="text-sm space-y-2">
          {logs.map((log, i) => (
            <p key={i}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
