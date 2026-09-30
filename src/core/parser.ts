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

  const setConfig = (key: 'quantum' | 'aging', value: number, where: string) => {
    // quantum 0 faria o Round-Robin nunca trocar de processo, virando FCFS em silêncio
    if (key === 'quantum' && value < 1) {
      throw new Error(`Quantum deve ser maior ou igual a 1 na ${where}.`);
    }
    if (key === 'aging' && value < 0) {
      throw new Error(`Aging não pode ser negativo na ${where}.`);
    }
    config[key] = value;
    defined[key] = true;
  };

  rawContent.split(/\r?\n/).forEach((rawLine, index) => {
    // Um comentário (`#` ou `//`) vale da marca até o fim da linha, esteja ela
    // inteira comentada ou só com uma observação depois dos números.
    const line = rawLine.split(/#|\/\//)[0].trim();
    const where = `linha ${index + 1}: "${rawLine.trim()}"`;

    if (!line) {
      return;
    }

    // Forma 1: chave-valor ("quantum: 2", "aging = 1", "quantum 2")
    const keyValue = line.match(/^(quantum|aging)\s*[:=\s]\s*(\d+)$/i);
    if (keyValue) {
      setConfig(keyValue[1].toLowerCase() as 'quantum' | 'aging', Number(keyValue[2]), where);
      return;
    }

    const tokens = line.split(/\s+/);
    const numbers = tokens.map(Number);
    if (numbers.some((n) => !Number.isInteger(n))) {
      // Inteiro não é capricho: a simulação avança de segundo em segundo, e uma
      // duração fracionária faria o tempo restante nunca chegar a zero.
      throw new Error(`Não entendi a ${where}. Esperado "quantum: N", "aging: N" ou três inteiros.`);
    }

    // Forma 2: cabeçalho numérico antes dos processos — "2 1", ou "2" e "1" em linhas separadas
    if (processes.length === 0 && tokens.length < 3) {
      if (tokens.length === 2 && !defined.quantum && !defined.aging) {
        setConfig('quantum', numbers[0], where);
        setConfig('aging', numbers[1], where);
        return;
      }
      if (tokens.length === 1 && (!defined.quantum || !defined.aging)) {
        setConfig(defined.quantum ? 'aging' : 'quantum', numbers[0], where);
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

  return { config, processes, configDefined: { ...defined } };
}

/** Só a configuração (quantum e aging) do conteúdo informado. */
export function parseConfig(rawContent: string): Config {
  return parseInput(rawContent).config;
}

/** Só a lista de processos do conteúdo informado. */
export function parseProcessInput(rawContent: string): ProcessInput[] {
  return parseInput(rawContent).processes;
}
