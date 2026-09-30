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
 *
 * Devolve { processes, config }. `config` traz APENAS as chaves que o texto
 * define — é null se não define nenhuma. Quem chama deve mesclar sobre a
 * configuração atual (`{ ...atual, ...config }`), nunca substituir: um arquivo
 * que só traz `aging` não pode zerar o quantum que o usuário digitou.
 *
 * Lança Error com mensagem legível (e número da linha) se a entrada for inválida.
 */
export function lerEntrada(texto) {
  const { processes, config, configDefined } = parseInput(texto);

  const lida = {};
  if (configDefined.quantum) lida.quantum = config.quantum;
  if (configDefined.aging) lida.aging = config.aging;
  const temConfig = Object.keys(lida).length > 0;

  const lidos = processes.map((p) => ({
    id: p.id,
    chegada: p.arrivalTime,
    duracao: p.duration,
    prioridade: p.staticPriority,
  }));

  if (lidos.length === 0 && !temConfig) {
    throw new Error(
      'Nada reconhecido. Use uma linha por processo (chegada duração prioridade, ex.: 0 5 2) ' +
        'e, se quiser, quantum: 2 e aging: 1.'
    );
  }

  return { processes: lidos, config: temConfig ? lida : null };
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
