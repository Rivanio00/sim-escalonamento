import React from 'react';
import { corDoProcesso } from './cores';
import './simulador.css';

// true: último processo em cima e P1 embaixo (junto ao eixo de tempo). false: P1 em cima.
const INVERTER_ORDEM = true;

/**
 * Um card por algoritmo. A simulação já está calculada; `t` é quantos segundos
 * já foram "revelados" (Run step avança 1, Fast run vai até o fim).
 * `eixo` é o número de colunas (o mesmo para todos os cards, para alinhar os tempos).
 */
function ResultCard({ titulo, subtitulo, result, erro, t, eixo, ids }) {
  if (erro) {
    return (
      <section className="rcard">
        <h2 className="panel-title">{titulo}</h2>
        <p className="msg-err">{erro}</p>
      </section>
    );
  }

  const { timeline, metrics = [], verticalDiagram } = result;
  const fim = timeline.length;
  const vistos = Math.min(t, fim);
  const concluido = t >= fim;
  const atual = vistos > 0 ? timeline[vistos - 1].runningProcessId : null;

  const final = (valor) => (concluido ? valor : '...');

  let emExecucao = '-';
  if (concluido) emExecucao = 'concluído';
  else if (atual) {
    emExecucao = (
      <>
        <i className="dot" style={{ background: corDoProcesso(atual) }} />
        {atual}
      </>
    );
  } else if (vistos > 0) emExecucao = 'ocioso';

  return (
    <section className="rcard">
      <h2 className="panel-title">
        {titulo}
        {subtitulo && <span className="rcard-sub">{subtitulo}</span>}
      </h2>

      <div className="rcard-body">
        <div className="rcard-chart">
          <div className="chart" style={{ gridTemplateColumns: `24px repeat(${eixo}, minmax(22px, 1fr))` }}>
            {(INVERTER_ORDEM ? [...ids].reverse() : ids).map((id) => (
              <React.Fragment key={id}>
                <span className="plabel">{id}</span>
                {Array.from({ length: eixo }, (_, s) => {
                  if (s >= vistos) return <span key={s} className="cell cell-future" />;
                  const estado = timeline[s].processStates?.[id];
                  if (estado === 'RUNNING') {
                    return <span key={s} className="cell" style={{ background: corDoProcesso(id) }} title={`${id}: ${s} a ${s + 1}`} />;
                  }
                  if (estado === 'READY') return <span key={s} className="cell cell-ready" title={`${id} esperando: ${s} a ${s + 1}`} />;
                  return <span key={s} className="cell" />;
                })}
              </React.Fragment>
            ))}
            <span />
            {Array.from({ length: eixo }, (_, s) => (
              <span key={s} className={`axis ${s === vistos - 1 ? 'axis-now' : ''}`}>{s}</span>
            ))}
          </div>
        </div>

        <div className="rcard-metrics">
          <div className="metric"><span>Turnaround médio</span><b>{final(result.averageTurnaroundTime.toFixed(2))}</b></div>
          <div className="metric"><span>Espera média</span><b>{final(result.averageWaitingTime.toFixed(2))}</b></div>
          <div className="metric"><span>Trocas de contexto</span><b>{final(result.contextSwitches)}</b></div>
          <div className="metric"><span>Em execução</span><b>{emExecucao}</b></div>
        </div>
      </div>

      {concluido && (
        <details className="more">
          <summary>Métricas por processo e diagrama de tempo</summary>
          <table className="mtable">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Conclusão</th>
                <th>Turnaround</th>
                <th>Espera</th>
                <th>Resposta</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.completionTime}</td>
                  <td>{m.turnaroundTime}</td>
                  <td>{m.waitingTime}</td>
                  <td>{m.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {verticalDiagram && <pre className="diagram">{verticalDiagram}</pre>}
        </details>
      )}
    </section>
  );
}

export default ResultCard;
