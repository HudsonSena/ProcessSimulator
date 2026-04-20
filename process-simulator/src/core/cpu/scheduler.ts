import { Process } from "../models/process";

export class Scheduler {
  queue: Process[] = [];

  // 🔹 Adiciona ao FIM da fila (usado para novos processos e processos vindos do disco)
  add(process: Process) {
    if (process.state === "waiting") return;
    if (this.queue.includes(process)) return;

    process.state = "ready";
    this.queue.push(process);
  }

  // 🔥 NOVO: Adiciona ao INÍCIO da fila (usado especificamente para quem sofreu Quantum)
  // Isso garante que ele tenha prioridade sobre quem já estava na fila ou quem acabou de chegar do disco
  addFirst(process: Process) {
  // Se o processo já está na fila, não duplica, mas garante que está no topo
  const index = this.queue.indexOf(process);
  if (index > -1) {
    this.queue.splice(index, 1);
  }
  process.state = "ready";
  this.queue.unshift(process); // Coloca no topo para ser o próximo
}

  next(): Process | null {
    if (this.queue.length === 0) return null;

    // 🚨 IMPORTANTE: Removi o sort() agressivo que estava no topo.
    // Se você ordenar por currentBurst aqui, a lógica de "prioridade de preempção" 
    // se quebra, pois o sort reorganiza a fila a cada pedido de processo.
    // Agora o next respeita estritamente a ordem da fila (FIFO com exceção do addFirst).

    const process = this.queue.shift() || null;

    if (process) {
      process.state = "running";
    }

    return process;
  }

  // 🔄 Ajustado para usar a lógica de prioridade
  requeue(process: Process) {
    if (process.state !== "running") return;
    process.state = "ready";

    // Se o objetivo é prioridade total para quem sofreu quantum:
    this.addFirst(process);
  }
}