import React from 'react';
import { ALGORITMOS } from './algoritmos';
import './simulador.css';

function AlgorithmPanel({ selecionados, setSelecionados }) {
  const todos = ALGORITMOS.every((a) => selecionados.includes(a.key));

  const alternar = (key) =>
    setSelecionados((sel) => (sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key]));

  const alternarTodos = () => setSelecionados(todos ? [] : ALGORITMOS.map((a) => a.key));

  return (
    <div className="panel">
      <h2 className="panel-title">Algoritmos</h2>
      <div className="algo-grid">
        {ALGORITMOS.map((a) => (
          <label key={a.key} className="check">
            <input type="checkbox" checked={selecionados.includes(a.key)} onChange={() => alternar(a.key)} />
            <span>{a.label}</span>
          </label>
        ))}
        <label className="check small">
          <input type="checkbox" checked={todos} onChange={alternarTodos} />
          <span>Todos</span>
        </label>
      </div>
    </div>
  );
}

export default AlgorithmPanel;
