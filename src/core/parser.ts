import type { Config, ParsedInput, ProcessInput } from './types.ts';

export const DEFAULT_CONFIG: Config = { quantum: 2, aging: 1 };

/**
 * Lê o arquivo de entrada do simulador.
 *
 * Linhas em branco e comentários (`#` ou `//`) são ignorados. O quantum e o aging
 * podem vir de duas formas, antes dos processos:
 *
 *   quantum: 2        (chave-valor; aceita `quantum: 2`, `quantum = 2`, `quantum 2`)
 *   aging: 1
 *
 *   2 1               (cabeçalho compacto `<quantum> <aging>`, ou um por linha)
 *
 * Se forem omitidos, valem os padrões de DEFAULT_CONFIG. Cada processo é uma linha
 * com três inteiros — `<instante_criacao> <duracao> <prioridade_estatica>`:
 *
 *   0 5 2
 *   0 2 3
 */
export function parseInput(rawContent: string): ParsedInput {
  const config: Config = { ...DEFAULT_CONFIG };
  const defined = { quantum: false, aging: false };
  const processes: ProcessInput[] = [];

  const setConfig = (key: 'quantum' | 'aging', value: number) => {
    config[key] = value;
    defined[key] = true;
  };

  rawContent.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    const where = `linha ${index + 1}: "${line}"`;

    if (!line || line.startsWith('#') || line.startsWith('//')) {
      return;
    }

    // Forma 1: chave-valor ("quantum: 2", "aging = 1", "quantum 2")
    const keyValue = line.match(/^(quantum|aging)\s*[:=\s]\s*(\d+)$/i);
    if (keyValue) {
      setConfig(keyValue[1].toLowerCase() as 'quantum' | 'aging', Number(keyValue[2]));
      return;
    }

    const tokens = line.split(/\s+/);
    const numbers = tokens.map(Number);
    if (numbers.some(Number.isNaN)) {
      throw new Error(`Não entendi a ${where}. Esperado "quantum: N", "aging: N" ou três inteiros.`);
    }

    // Forma 2: cabeçalho numérico antes dos processos — "2 1", ou "2" e "1" em linhas separadas
    if (processes.length === 0 && tokens.length < 3) {
      if (tokens.length === 2 && !defined.quantum && !defined.aging) {
        setConfig('quantum', numbers[0]);
        setConfig('aging', numbers[1]);
        return;
      }
      if (tokens.length === 1 && (!defined.quantum || !defined.aging)) {
        setConfig(defined.quantum ? 'aging' : 'quantum', numbers[0]);
        return;
      }
    }

    // Processos: exatamente três inteiros
    if (tokens.length !== 3) {
      throw new Error(`Esperava 3 valores (chegada, duração, prioridade) na ${where}.`);
    }

    const [arrivalTime, duration, staticPriority] = numbers;
    if (arrivalTime < 0) {
      throw new Error(`Instante de criação não pode ser negativo na ${where}.`);
    }
    if (duration <= 0) {
      throw new Error(`Duração deve ser maior que zero na ${where}.`);
    }
    if (staticPriority < 0) {
      throw new Error(`Prioridade estática não pode ser negativa na ${where}.`);
    }

    const order = processes.length + 1;
    processes.push({ id: `P${order}`, order, arrivalTime, duration, staticPriority });
  });

  return { config, processes, configFromInput: defined.quantum || defined.aging };
}

/** Só a configuração (quantum e aging) do conteúdo informado. */
export function parseConfig(rawContent: string): Config {
  return parseInput(rawContent).config;
}

/** Só a lista de processos do conteúdo informado. */
export function parseProcessInput(rawContent: string): ProcessInput[] {
  return parseInput(rawContent).processes;
}
