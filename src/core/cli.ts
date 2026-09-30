import * as fs from 'node:fs';
import * as process from 'node:process';
import { InputError, parseInput } from './parser.ts';
import { simulateAll } from './simulate.ts';
import { formatStdoutReport } from './formatter.ts';

const USAGE = `Uso:
  node src/core/cli.ts <entrada.txt> [config.txt]
  node src/core/cli.ts < entrada.txt

Sem argumentos, carrega samples/entrada.txt.`;

/**
 * Lê um arquivo, convertendo as falhas do sistema de arquivos (caminho é uma
 * pasta, sem permissão de leitura, ...) em InputError — do ponto de vista de
 * quem usa a CLI, isso é entrada errada, não defeito do programa.
 */
function lerArquivo(caminho: string | number, nome = String(caminho)): string {
  try {
    return fs.readFileSync(caminho, 'utf-8');
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new InputError(`Não consegui ler ${nome}: ${motivo}\n\n${USAGE}`);
  }
}

/** Lê o conteúdo da entrada: argumento de linha de comando, stdin redirecionado ou o sample. */
function readRawInput(args: string[]): string {
  if (args.length > 0) {
    if (!fs.existsSync(args[0])) {
      console.error(`Arquivo de entrada não encontrado: ${args[0]}\n\n${USAGE}`);
      process.exit(1);
    }
    return lerArquivo(args[0], `"${args[0]}"`);
  }

  if (!process.stdin.isTTY) {
    // Falha de leitura vira erro: cair no sample em silêncio faria o programa
    // relatar a simulação do exemplo como se fosse a entrada do usuário.
    const daEntradaPadrao = lerArquivo(0, 'a entrada padrão (stdin)');
    // Já um stdin vazio não é erro — segue para o sample, como quando não se
    // passa argumento nenhum.
    if (daEntradaPadrao.trim()) {
      return daEntradaPadrao;
    }
  }

  if (fs.existsSync('samples/entrada.txt')) {
    console.log('Nenhuma entrada fornecida. Carregando "samples/entrada.txt"...\n');
    return lerArquivo('samples/entrada.txt', '"samples/entrada.txt"');
  }

  console.error(USAGE);
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  const { config, processes } = parseInput(readRawInput(args));

  // Um arquivo de config no 2º argumento sobrescreve o quantum/aging da entrada —
  // mas só as chaves que ele realmente define, para não apagar o que a entrada trazia.
  if (args.length > 1) {
    if (!fs.existsSync(args[1])) {
      console.error(`Arquivo de configuração não encontrado: ${args[1]}\n\n${USAGE}`);
      process.exit(1);
    }
    const override = parseInput(lerArquivo(args[1], `"${args[1]}"`));
    if (override.configDefined.quantum) config.quantum = override.config.quantum;
    if (override.configDefined.aging) config.aging = override.config.aging;
  }

  if (processes.length === 0) {
    console.error('Nenhum processo válido encontrado na entrada.');
    process.exit(1);
  }

  console.log(`Configuração carregada: quantum=${config.quantum}, aging=${config.aging}`);
  console.log(`Total de processos carregados: ${processes.length}`);
  console.log('-'.repeat(64) + '\n');

  for (const result of simulateAll(processes, config)) {
    console.log(formatStdoutReport(result));
  }
}

try {
  main();
} catch (erro) {
  // Entrada ruim do usuário: a mensagem já diz a linha, o stack trace só atrapalha.
  if (erro instanceof InputError) {
    console.error(erro.message);
    process.exit(1);
  }
  // Qualquer outra coisa é bug nosso — deixa subir com o stack trace inteiro.
  throw erro;
}
