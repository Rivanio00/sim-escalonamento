import { parseInput } from '../core/parser.ts';

// Formato usado na tela: { id, chegada, duracao, prioridade }.
// O motor usa { id, order, arrivalTime, duration, staticPriority } — a conversão
// entre os dois acontece aqui e em paraMotor(), e em nenhum outro lugar.

/**
 * Valida o que o formulário de "Adicionar processo" produz. As mesmas regras do
 * parser (src/core/parser.ts), mas aplicadas a um processo já em memória.
 */
export function validarProcessos(lista) {
  const erros = [];
  const inteiro = (v) => Number.isInteger(Number(v));

  lista.forEach((p) => {
    if (!inteiro(p.chegada) || Number(p.chegada) < 0) {
      erros.push(`${p.id}: chegada deve ser um inteiro maior ou igual a 0.`);
    }
    if (!inteiro(p.duracao) || Number(p.duracao) < 1) {
      erros.push(`${p.id}: duração deve ser um inteiro maior ou igual a 1.`);
    }
    if (!inteiro(p.prioridade) || Number(p.prioridade) < 0) {
      erros.push(`${p.id}: prioridade deve ser um inteiro maior ou igual a 0.`);
    }
  });

  return erros;
}

/**
 * Lê um texto no formato do projeto (o mesmo da CLI e do samples/entrada.txt).
 * Devolve { processes, config }, com config em null quando o texto não define
 * quantum nem aging — assim a tela preserva o que o usuário já havia digitado.
 * Lança Error com mensagem legível (e número da linha) se a entrada for inválida.
 */
export function lerEntrada(texto) {
  const { processes, config, configFromInput } = parseInput(texto);

  const lidos = processes.map((p) => ({
    id: p.id,
    chegada: p.arrivalTime,
    duracao: p.duration,
    prioridade: p.staticPriority,
  }));

  if (lidos.length === 0 && !configFromInput) {
    throw new Error(
      'Nada reconhecido. Use uma linha por processo (chegada duração prioridade, ex.: 0 5 2) ' +
        'e, se quiser, quantum: 2 e aging: 1.'
    );
  }

  return { processes: lidos, config: configFromInput ? config : null };
}

/** Converte a lista da tela para o formato que o motor de simulação espera. */
export function paraMotor(processes) {
  return processes.map((p, i) => ({
    id: p.id,
    order: i + 1,
    arrivalTime: Number(p.chegada),
    duration: Number(p.duracao),
    staticPriority: Number(p.prioridade),
  }));
}
