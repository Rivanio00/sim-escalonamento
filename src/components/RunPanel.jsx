import './simulador.css';

function RunPanel({ t, total, temResultado, onStep, onFast, onReset }) {
  const terminou = total > 0 && t >= total;
  return (
    <div className="panel runpanel">
      <button type="button" className="btn btn-primary" onClick={onStep} disabled={!temResultado || terminou}>
        Run step
      </button>
      <button type="button" className="btn" onClick={onFast} disabled={!temResultado || terminou}>
        Fast run
      </button>
      <button type="button" className="btn" onClick={onReset} disabled={t === 0}>
        Reiniciar
      </button>
      <span className="muted small">t = {t}</span>
    </div>
  );
}

export default RunPanel;
