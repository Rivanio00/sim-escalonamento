import React, { useRef, useState } from 'react';
import { lerEntrada } from './entrada';
import './simulador.css';

function ConfigPanel({ config, setConfig, setProcesses }) {
  const inputRef = useRef(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  // Permite apagar o campo enquanto digita; o App sanitiza o valor na hora de simular
  const valor = (e) => (e.target.value === '' ? '' : Number(e.target.value));

  const carregarArquivo = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    try {
      const { processes, config: lida } = lerEntrada(await arquivo.text());
      const partes = [];
      if (lida) {
        setConfig(lida);
        partes.push(`quantum ${lida.quantum}, aging ${lida.aging}`);
      }
      if (processes.length > 0 && setProcesses) {
        setProcesses(processes);
        partes.push(`${processes.length} processo(s)`);
      }
      setErro('');
      setAviso(`Carregado: ${partes.join(' e ')}.`);
    } catch (err) {
      setAviso('');
      setErro(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Configuração</h2>
      <div className="two-cols">
        <div className="field">
          <label htmlFor="cfg-quantum">quantum</label>
          <input id="cfg-quantum" className="input" type="number" min="1" value={config.quantum} onChange={(e) => setConfig({ ...config, quantum: valor(e) })} />
        </div>
        <div className="field">
          <label htmlFor="cfg-aging">aging</label>
          <input id="cfg-aging" className="input" type="number" min="0" value={config.aging} onChange={(e) => setConfig({ ...config, aging: valor(e) })} />
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={() => inputRef.current?.click()}>Carregar arquivo .txt</button>
        <input ref={inputRef} type="file" accept=".txt,text/plain" hidden onChange={carregarArquivo} />
      </div>
      <p className="hint">Formato do arquivo: quantum:2 e aging:1</p>
      {erro && <p className="msg-err" role="alert">{erro}</p>}
      {aviso && <p className="msg-ok" role="status">{aviso}</p>}
    </div>
  );
}

export default ConfigPanel;
