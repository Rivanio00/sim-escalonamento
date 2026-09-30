# Simulador de Escalonamento de Processos

Trabalho de Sistemas Operacionais. Simula sete algoritmos de escalonamento sobre a
mesma lista de processos e mostra, para cada um, o diagrama de tempo segundo a segundo
e as métricas (tempo médio de vida, tempo médio de espera e trocas de contexto).

O motor de simulação é TypeScript puro, sem React e sem Node: roda igual no terminal,
nos testes e no navegador.

## Rodar

```bash
npm install

npm start                          # relatório no terminal, usando samples/entrada.txt
npm start samples/entrada.txt      # ou um arquivo específico
npm start < samples/entrada.txt     # ou por stdin

npm test          # testes do motor (incluindo o gabarito do enunciado)
npm run typecheck # checagem de tipos
npm run dev       # interface web (Vite)
```

## Formato da entrada

```
quantum: 2        # opcional (padrão 2); também aceita o cabeçalho compacto "2 1"
aging: 1          # opcional (padrão 1)

# <chegada> <duração> <prioridade estática>
0 5 2
0 2 3
1 4 1
3 3 4
```

Os processos são numerados na ordem de declaração: `P1`, `P2`, ... Linhas em branco e
comentários (`#` ou `//`) são ignorados; qualquer outra linha inválida vira um erro
explícito, com o número da linha.

## Algoritmos

| Sigla | Algoritmo | Preempta? | Quantum | Critério de escolha |
|-------|-----------|-----------|---------|---------------------|
| `FCFS` | First Come, First Served | não | — | menor instante de chegada |
| `SJF`  | Shortest Job First | não | — | menor duração total |
| `SRTF` | Shortest Remaining Time First | sim | — | menor tempo restante |
| `PNP`  | Prioridade sem preempção | não | — | maior prioridade estática |
| `PP`   | Prioridade com preempção | sim | — | maior prioridade estática |
| `RR`   | Round-Robin | por quantum | sim | fila FIFO |
| `RRA`  | Round-Robin com envelhecimento | por quantum | sim | maior prioridade dinâmica |

## Estrutura

```
sim-escalonamento/
├── docs/DECISOES.md        # decisões de implementação (entregável)
├── samples/entrada.txt     # exemplo de entrada
└── src/
    ├── core/               # motor de simulação (TypeScript puro)
    │   ├── types.ts        # ProcessInput, RuntimeProcess, métricas, resultado
    │   ├── engine.ts       # O LAÇO DA SIMULAÇÃO — um segundo por iteração, único
    │   ├── schedulers.ts   # os 7 algoritmos: só o que difere entre eles
    │   ├── tieBreaker.ts   # as regras de desempate do enunciado
    │   ├── parser.ts       # texto da entrada -> { config, processes }
    │   ├── formatter.ts    # diagrama vertical + relatório de texto
    │   ├── simulate.ts     # catálogo dos algoritmos, simulate() e simulateAll()
    │   ├── index.ts        # o que o resto do projeto importa
    │   ├── cli.ts          # linha de comando (npm start)
    │   ├── test.ts         # testes unitários
    │   └── test-gabarito.ts# casos com gabarito calculado à mão + invariantes
    ├── App.jsx             # interface web: monta os painéis e roda a simulação
    ├── main.jsx
    └── components/
        ├── ProcessPanel.jsx   # tabela de processos, formulário e "colar entrada"
        ├── ConfigPanel.jsx    # quantum, aging e carregar arquivo .txt
        ├── AlgorithmPanel.jsx # seleção dos algoritmos (a lista vem do core)
        ├── RunPanel.jsx       # Run step / Fast run / Reiniciar
        ├── ResultCard.jsx     # um card por algoritmo: Gantt + métricas
        ├── entrada.js         # conversão tela <-> motor e validação do formulário
        ├── cores.js           # cor de cada processo
        └── simulador.css      # tema escuro, CSS próprio (sem framework)
```

### A interface

`npm run dev` abre a tela em http://localhost:5173. Dá para montar a lista de processos
à mão, colar uma entrada no mesmo formato da CLI ou carregar um `.txt`; escolher quantum
e aging; marcar quantos algoritmos quiser; e avançar a execução segundo a segundo
(**Run step**) ou até o fim (**Fast run**). Cada algoritmo marcado vira um card com o
diagrama de Gantt colorido, as médias e, ao terminar, a tabela por processo e o mesmo
diagrama vertical que a CLI imprime.

A tela não tem lógica de escalonamento: ela lê a lista `ALGORITHMS` do core, chama
`runSimulation` e desenha `result.timeline`. Não existe uma segunda lista de algoritmos
para manter em sincronia.

### Como o motor está organizado

Todos os sete algoritmos compartilham o mesmo laço (`engine.ts`), que a cada segundo:

1. registra as chegadas daquele instante;
2. devolve à fila quem esgotou o quantum no segundo anterior;
3. escolhe quem usa o processador (sempre, se o algoritmo é preemptivo; senão, só
   quando o processador está livre);
4. conta a troca de contexto e grava o estado de cada processo naquele segundo;
5. executa um segundo e trata fim de processo ou fim de quantum.

Um algoritmo (`Scheduler`, em `schedulers.ts`) é só isto: se preempta, se tem quantum,
e uma função de pontuação — ganha o processo de maior pontuação. Por exemplo:

```ts
export const srtf: Scheduler = {
  name: 'Shortest Remaining Time First (SRTF)',
  preemptive: true,
  quantum: null,
  score: (p) => -p.remainingTime, // menor tempo restante = maior pontuação
};
```

Empates caem nas regras do enunciado, em `tieBreaker.ts`. Adicionar um algoritmo novo é
escrever um objeto desses e registrá-lo em `ALGORITHMS` (`simulate.ts`) — a CLI e a
interface passam a oferecê-lo sozinhas.
