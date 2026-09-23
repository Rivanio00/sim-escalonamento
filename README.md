# Simulador de Escalonamento de Processos
Trabalho de Sistemas Operacionais. React + JavaScript.

## Rodar
```bash
npm install
npm run dev
```

## Estrutura de pastas
```
sim-escalonamento/
├── docs/
│   └── DECISOES.md          # documento de decisões (entregável)
├── src/
│   ├── core/                # motor de simulação: JS puro, sem React
│   │   ├── basic.js         # FCFS, SJF, SRTF
│   │   ├── priority.js      # prioridade (2 versões), RR, RR com aging
│   │   ├── parser.js        # lê a entrada de processos e o config
│   │   ├── metrics.js       # métricas + regra de desempate
│   │   └── simulate.js      # simulate(processes, config, algoritmo)
│   ├── components/
│   │   ├── ProcessPanel.jsx # lista, popup de entrada e config
│   │   ├── Controls.jsx     # checkboxes, run step e fast run
│   │   └── Gantt.jsx        # gráfico + painel de métricas
│   └── App.jsx
└── README.md
```