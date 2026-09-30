import { parseInput, parseConfig } from '../core/parser';

// Formato usado na tela: { id, chegada, duracao, prioridade }

// Garante entradas que o motor consegue simular (duração 0, por exemplo, travaria o laço).
export function validarProcessos(lista) {
  const erros = [];
  lista.forEach((p) => {
    if (!Number.isInteger(Number(p.chegada)) || Number(p.chegada) < 0) erros.push(`${p.id}: chegada deve ser um inteiro maior ou igual a 0.`);
    if (!Number.isInteger(Number(p.duracao)) || Number(p.duracao) < 1) erros.push(`${p.id}: duração deve ser um inteiro maior ou igual a 1.`);
    if (!Number.isInteger(Number(p.prioridade)) || Number(p.prioridade) < 1) erros.push(`${p.id}: prioridade deve ser um inteiro maior ou igual a 1.`);
  });
  return erros;
}

const linhasUteis = (texto) =>
  texto
    .split('\n')
    .map((l) => l.split('#')[0].trim())
    .filter(Boolean);

// O parser devolve quantum=2 e aging=1 quando o texto não os define. Só aplicamos a config
// se o texto realmente a traz: "quantum: 2", "aging: 1" ou uma linha de cabeçalho com
// menos de 3 números ("2 1" ou "2").
function textoDefineConfig(texto) {
  return linhasUteis(texto).some((l) => /^(quantum|aging)\s*:/i.test(l) || l.split(/\s+/).length < 3);
}

const temLinhaDeProcesso = (texto) => linhasUteis(texto).some((l) => /^\d+\s+\d+\s+\d+/.test(l));

/**
 * Lê um texto no padrão do projeto (mesmo do parser.ts).
 * Retorna { processes, config }: config é null quando o texto não define quantum/aging.
 * Lança Error com mensagem legível se a entrada for inválida.
 */
export function lerEntrada(texto) {
  const definiuConfig = textoDefineConfig(texto);
  let processes = [];
  let config = null;

  try {
    const r = parseInput(texto);
    processes = (r.processes || []).map((p) => ({
      id: p.id,
      chegada: p.arrivalTime,
      duracao: p.duration,
      prioridade: p.staticPriority,
    }));
    if (definiuConfig) config = { quantum: r.config.quantum, aging: r.config.aging };
  } catch (err) {
    // Arquivo só com configuração pode não ser aceito pelo parseInput: tenta o parseConfig
    if (!definiuConfig || temLinhaDeProcesso(texto)) throw err;
    const c = parseConfig(texto);
    config = { quantum: c.quantum, aging: c.aging };
  }

  const erros = validarProcessos(processes);
  if (erros.length > 0) throw new Error(erros.join('\n'));
  if (processes.length === 0 && !config) {
    throw new Error('Nada reconhecido. Use uma linha por processo (chegada duração prioridade, ex.: 0 5 2) e, se quiser, quantum: 2 e aging: 1.');
  }
  return { processes, config };
}
