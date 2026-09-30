// Cor de cada processo (P1 azul, P2 amarelo, P3 roxo, P4 verde, P5 vermelho, ...)
export const PALETA = ['#58a6ff', '#e3b341', '#a371f7', '#3ecf8e', '#f85149', '#f0883e', '#39c5cf', '#ff7eb6'];

export const corDoProcesso = (id) => {
  const n = parseInt(String(id).replace(/\D/g, ''), 10) || 1;
  return PALETA[(n - 1) % PALETA.length];
};
