import { useState } from 'react';
import { corDoProcesso } from './cores';
import { lerEntrada, validarProcessos } from './entrada';
import './simulador.css';

// Exemplo do enunciado
const EXEMPLO = `quantum: 2
aging: 1

0 5 2
0 2 3
1 4 1
3 3 4`;

function ProcessPanel({ processes, setProcesses, setConfig }) {
  const [form, setForm] = useState({ chegada: '', duracao: '', prioridade: '' });
  const [erro, setErro] = useState('');
  const [colando, setColando] = useState(false);
  const [texto, setTexto] = useState('');
  const [erroTexto, setErroTexto] = useState('');
  const [aviso, setAviso] = useState('');

  const campo = (nome) => (e) => setForm({ ...form, [nome]: e.target.value });

  const adicionar = (e) => {
    e.preventDefault();
    if (form.chegada === '' || form.duracao === '' || form.prioridade === '') {
      setErro('Preencha chegada, duração e prioridade.');
      return;
    }
    const novo = {
      id: `P${processes.length + 1}`,
      chegada: Number(form.chegada),
      duracao: Number(form.duracao),
      prioridade: Number(form.prioridade),
    };
    const erros = validarProcessos([novo]);
    if (erros.length > 0) {
      setErro(erros.join('\n'));
      return;
    }
    setProcesses([...processes, novo]);
    setForm({ chegada: '', duracao: '', prioridade: '' });
    setErro('');
    setAviso('');
  };

  // Remove e renumera (P1..Pn), igual ao que o parser faria com a lista restante
  const remover = (id) => {
    setProcesses(processes.filter((p) => p.id !== id).map((p, i) => ({ ...p, id: `P${i + 1}` })));
    setAviso('');
  };

  const importar = () => {
    try {
      const { processes: lidos, config } = lerEntrada(texto);
      if (lidos.length > 0) setProcesses(lidos);
      if (config && setConfig) setConfig((atual) => ({ ...atual, ...config }));
      const partes = [];
      if (lidos.length > 0) partes.push(`${lidos.length} processo(s) importado(s) (a lista anterior foi substituída)`);
      if (config) {
        partes.push(Object.entries(config).map(([c, v]) => `${c} ${v}`).join(', '));
      }
      setAviso(partes.join('; ') + '.');
      setErroTexto('');
      setColando(false);
      setTexto('');
    } catch (err) {
      setErroTexto(err instanceof Error ? err.message : String(err));
    }
  };

  const cancelar = () => {
    setColando(false);
    setTexto('');
    setErroTexto('');
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Processos</h2>

      {processes.length > 0 ? (
        <table className="ptable">
          <thead>
            <tr>
              <th>Id</th>
              <th>Chegada</th>
              <th>Duração</th>
              <th>Prior.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id}>
                <td>
                  <i className="dot" style={{ background: corDoProcesso(p.id) }} />
                  {p.id}
                </td>
                <td>{p.chegada}</td>
                <td>{p.duracao}</td>
                <td>{p.prioridade}</td>
                <td>
                  <button type="button" className="btn-x" onClick={() => remover(p.id)} aria-label={`Remover ${p.id}`}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">Nenhum processo. Adicione um abaixo ou cole uma entrada.</p>
      )}

      <form onSubmit={adicionar} style={{ marginTop: 10 }}>
        <div className="three-cols">
          <input className="input" type="number" min="0" placeholder="chegada" aria-label="Chegada" value={form.chegada} onChange={campo('chegada')} />
          <input className="input" type="number" min="1" placeholder="duração" aria-label="Duração" value={form.duracao} onChange={campo('duracao')} />
          <input className="input" type="number" min="0" placeholder="prior." aria-label="Prioridade" value={form.prioridade} onChange={campo('prioridade')} />
        </div>
        <div className="actions">
          <button type="submit" className="btn btn-primary">Adicionar</button>
          <button type="button" className="btn" onClick={() => setColando(!colando)}>
            Colar entrada
          </button>
        </div>
      </form>
      {erro && <p className="msg-err" role="alert">{erro}</p>}

      {colando && (
        <div style={{ marginTop: 10 }}>
          <textarea
            className="input"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'quantum: 2\naging: 1\n\n0 5 2\n0 2 3'}
            aria-label="Texto de entrada"
            spellCheck={false}
            autoFocus
          />
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={importar} disabled={!texto.trim()}>Importar</button>
            <button type="button" className="btn" onClick={() => setTexto(EXEMPLO)}>Usar exemplo</button>
            <button type="button" className="btn" onClick={cancelar}>Cancelar</button>
          </div>
          <p className="hint">Uma linha por processo: chegada duração prioridade. Quantum e aging são opcionais.</p>
          {erroTexto && <p className="msg-err" role="alert">{erroTexto}</p>}
        </div>
      )}
      {aviso && <p className="msg-ok" role="status">{aviso}</p>}
    </div>
  );
}

export default ProcessPanel;
