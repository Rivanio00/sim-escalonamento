# Decisões de implementação

## Estrutura do processo

Dois tipos, em `src/core/types.ts`:

- `ProcessInput` — o que vem do arquivo: `id`, `order` (ordem de declaração),
  `arrivalTime`, `duration`, `staticPriority`. Nunca é alterado pela simulação.
- `RuntimeProcess` — o estado durante a execução: `remainingTime`,
  `currentPriority` (prioridade dinâmica, pd), `queueSeq` (posição na fila do RR),
  `startTime` e `completionTime`.

O estado do processo (executando / pronto / não existe) não é guardado no processo: é
derivado a cada segundo e gravado na linha do tempo (`SecondState.processStates`),
que é exatamente o que o diagrama vertical imprime.

## O motor único

Os sete algoritmos usam o mesmo laço de simulação (`src/core/engine.ts`), que avança
um segundo por iteração. Um algoritmo é descrito apenas por:

- `preemptive` — reavalia a escolha a cada segundo, ou só quando o processador fica livre;
- `quantum` — tempo máximo de CPU por despacho (`null` se não há quantum);
- `score(p)` — entre os prontos, ganha o de maior pontuação;
- opcionalmente `onArrival`, `onQuantumExpired` e `onDispatch` (usados pelo RR e pelo aging).

## Algoritmos

| Sigla | `preemptive` | `quantum` | `score` |
|-------|--------------|-----------|---------|
| FCFS | `false` | `null` | `-arrivalTime` |
| SJF | `false` | `null` | `-duration` |
| SRTF | `true` | `null` | `-remainingTime` |
| PNP (Prioridade sem preempção) | `false` | `null` | `staticPriority` |
| PP (Prioridade com preempção) | `true` | `null` | `staticPriority` |
| RR | `false` | `config.quantum` | `-queueSeq` (fila FIFO) |
| RRA (RR com envelhecimento) | `false` | `config.quantum` | `currentPriority` (pd) |

### Round-Robin

A fila FIFO é representada por um número de ordem (`queueSeq`) atribuído quando o
processo entra na fila; ganha o menor. Não há reavaliação por segundo: a troca só
acontece quando o quantum se esgota ou o processo termina.

### Round-Robin com envelhecimento

Segue o "algoritmo simples" visto em aula: a pd começa igual à prioridade estática; a
cada despacho, roda quem tem maior pd, todos os OUTROS prontos ganham `+aging`, e o
escolhido volta à sua prioridade estática. Não há preempção por prioridade — uma
chegada mais prioritária espera o fim do quantum.

## Convenções

- **Prioridade:** maior valor = maior prioridade.
- **Desempate** (`src/core/tieBreaker.ts`), na ordem do enunciado:
  1. o processo que já está com o processador (evita troca de contexto);
  2. o de menor tempo restante de processamento;
  3. o de menor instante de chegada e, por fim, o declarado primeiro (P1 antes de P2).

  O enunciado diz "aleatório" no item 3. Usamos um critério fixo para que a simulação
  seja reprodutível — mesma entrada, mesmo diagrama — o que é o que permite conferir o
  resultado contra o gabarito nos testes.
- **Round-Robin:** quem chega no instante `t` entra na fila antes do processo que foi
  preemptado por fim de quantum no mesmo `t` (conforme o exemplo dado em aula). No
  motor, isso é o passo 1 antes do passo 2: as chegadas são registradas e só depois o
  preemptado volta para a fila.
- **Troca de contexto:** conta quando o processo em execução muda para *outro* processo.
  Continuar o mesmo processo não conta, e entrar ou sair de um período de processador
  ocioso também não.
- **Tempo:** a simulação é discreta, em segundos inteiros; o segundo `t` é o intervalo
  `[t, t+1)`. `completionTime` é o fim do último segundo executado.
- **Métricas:** tempo de vida `tt = completionTime - arrivalTime`; tempo de espera
  `tw = tt - duration`; tempo de resposta `= startTime - arrivalTime`.

## Pontos a confirmar com o professor

- No FCFS, quando dois processos chegam no mesmo instante, a regra de desempate (ii)
  do enunciado escolhe o de menor duração — e não a ordem de declaração. Foi o que
  implementamos, mas é uma leitura do enunciado, não uma definição clássica de FCFS.
- No RR com envelhecimento, o processo que acabou de esgotar o quantum pode ser
  escolhido de novo imediatamente se ainda empatar na maior pd (regra de desempate (i)).
  Com `aging > 0` isso praticamente não acontece, porque a pd dele volta à estática
  enquanto a dos outros sobe.
