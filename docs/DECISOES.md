# Decisões de implementação

## Estrutura do processo
(id, chegada, duração, restante, prioridade estática/dinâmica, status)

## Algoritmos
(uma seção por algoritmo)

## Convenções
- Maior valor de prioridade = maior prioridade
- Desempate: (i) quem já está na CPU, (ii) menor tempo restante, (iii) aleatório (seed fixa)
- RR: quem chega no instante t entra na fila antes do processo preemptado no mesmo t
