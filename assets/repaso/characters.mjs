const names = ['Vector', 'Pixel', 'Nodo', 'Query', 'Byte', 'Índice', 'Matriz', 'Dato', 'Lambda', 'Bit', 'Nexo', 'Pivote', 'Delta', 'Sigma', 'Mapa', 'Prisma'];
const palettes = [ ['Cobalto', '#1f497d'], ['Ámbar', '#947000'], ['Pino', '#22644a'], ['Coral', '#a04434'], ['Violeta', '#685187'] ];
export const CHARACTER_COUNT = names.length * palettes.length;

export function characterName(index) {
  if (!Number.isInteger(index) || index < 0 || index >= CHARACTER_COUNT) throw new Error('Personaje inválido.');
  return `${names[index % names.length]} ${palettes[Math.floor(index / names.length)][0]}`;
}

export function renderCharacter(index) {
  const name = characterName(index);
  const color = palettes[Math.floor(index / names.length)][1];
  const variant = index % names.length;
  const wrapper = document.createElement('span');
  wrapper.className = 'character';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 80 80');
  svg.setAttribute('aria-hidden', 'true');
  // All interpolated values are constrained numbers or constants from this module.
  svg.innerHTML = `<circle cx="40" cy="40" r="38" fill="#e8edf2"/><path d="M40 21V10" stroke="${color}" stroke-width="3"/><circle cx="40" cy="9" r="4" fill="${color}"/><rect x="17" y="23" width="46" height="40" rx="${4 + variant % 4 * 4}" fill="${color}"/><rect x="24" y="31" width="32" height="15" rx="4" fill="white"/><circle cx="${31 + variant % 2 * 2}" cy="38" r="3" fill="#151616"/><circle cx="${47 - variant % 2 * 2}" cy="38" r="3" fill="#151616"/><path d="M30 53h${10 + variant % 4 * 3}" stroke="#ffff33" stroke-width="3"/><path d="M12 33v17M68 33v17" stroke="${color}" stroke-width="5"/><text x="58" y="72" font-family="sans-serif" font-size="11" fill="#151616">${String(variant + 1).padStart(2, '0')}</text>`;
  const label = document.createElement('span');
  label.textContent = name;
  wrapper.append(svg, label);
  return wrapper;
}
