import type { Config, ParsedInput, ProcessInput } from './types.ts';

/**
 * Faz o parsing completo do arquivo de entrada do simulador.
 *
 * Suporta a definição de quantum e aging diretamente no arquivo de entrada:
 * 1. Formato chave-valor (conforme especificação):
 *    quantum: 2
 *    aging: 1
 * 2. Formato cabeçalho numérico (na primeira linha antes dos processos):
 *    <quantum> <aging> (ex: "2 1") ou em duas linhas separadas ("2" e "1")
 * 3. Valores padrão: quantum = 2, aging = 1 (se omitidos)
 *
 * Cada processo é definido em uma linha com 3 inteiros:
 *    <instante_criacao> <duracao_segundos> <prioridade_estatica>
 *    Exemplo:
 *    0 5 2
 *    0 2 3
 */
export function parseInput(rawContent: string): ParsedInput {
  const config: Config = {
    quantum: 2,
    aging: 1,
  };
  let quantumDefined = false;
  let agingDefined = false;

  const processes: ProcessInput[] = [];
  const lines = rawContent.split(/\r?\n/);
  let processCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // 1. Verifica padrão chave-valor: "quantum: 2", "quantum = 2", "quantum 2", "aging: 1", etc.
    const kvMatch = trimmed.match(/^(quantum|aging)\s*[:=\s]\s*(\d+)$/i);
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase();
      const val = Number.parseInt(kvMatch[2], 10);
      if (!Number.isNaN(val)) {
        if (key === 'quantum') {
          config.quantum = val;
          quantumDefined = true;
        } else if (key === 'aging') {
          config.aging = val;
          agingDefined = true;
        }
        continue;
      }
    }

    const tokens = trimmed.split(/\s+/);

    // 2. Se nenhum processo foi lido ainda e quantum/aging não foram ambos definidos:
    // Suporta cabeçalho compacto como "2 1" (<quantum> <aging>) ou linhas únicas "2", "1"
    if (processes.length === 0) {
      if (tokens.length === 2 && !quantumDefined && !agingDefined) {
        const q = Number.parseInt(tokens[0], 10);
        const a = Number.parseInt(tokens[1], 10);
        if (!Number.isNaN(q) && !Number.isNaN(a)) {
          config.quantum = q;
          config.aging = a;
          quantumDefined = true;
          agingDefined = true;
          continue;
        }
      }

      if (tokens.length === 1) {
        const val = Number.parseInt(tokens[0], 10);
        if (!Number.isNaN(val)) {
          if (!quantumDefined) {
            config.quantum = val;
            quantumDefined = true;
            continue;
          }
          if (!agingDefined) {
            config.aging = val;
            agingDefined = true;
            continue;
          }
        }
      }
    }

    // 3. Processos (linhas com 3 colunas)
    if (tokens.length >= 3) {
      const arrivalTime = Number.parseInt(tokens[0], 10);
      const duration = Number.parseInt(tokens[1], 10);
      const staticPriority = Number.parseInt(tokens[2], 10);

      if (Number.isNaN(arrivalTime) || Number.isNaN(duration) || Number.isNaN(staticPriority)) {
        continue;
      }

      if (duration <= 0) {
        throw new Error(`Duração inválida do processo na linha: "${trimmed}". Deve ser > 0.`);
      }

      if (arrivalTime < 0) {
        throw new Error(`Instante de criação negativo na linha: "${trimmed}".`);
      }

      processCount += 1;
      processes.push({
        id: `P${processCount}`,
        order: processCount,
        arrivalTime,
        duration,
        staticPriority,
      });
    }
  }

  return { config, processes };
}

/**
 * Extrai a configuração (quantum e aging) a partir do conteúdo do arquivo.
 */
export function parseConfig(rawContent: string): Config {
  return parseInput(rawContent).config;
}

/**
 * Extrai a lista de processos a partir do conteúdo do arquivo.
 */
export function parseProcessInput(rawContent: string): ProcessInput[] {
  return parseInput(rawContent).processes;
}
