const setSection = document.getElementById('page-set');
if (setSection) {
  const esc = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\\': '&#92;' }[char]));
  const show = (value) => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  const table = (rows) => '<table>' + rows.map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(show(value))}</td></tr>`).join('') + '</table>';

  const setInputs = {
    a: document.getElementById('set-a'),
    b: document.getElementById('set-b'),
    run: document.getElementById('set-run'),
    output: document.getElementById('set-output')
  };

  const POWER_LIMIT = 10; // 2^10 = 1024 subsets is the most we list on screen
  const PRODUCT_LIMIT = 200; // most ordered pairs we list on screen

  const parse = (text) => new Set(text.split(/[\s,]+/).filter(Boolean));
  const sorted = (values) => Array.from(values).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  const format = (values) => '{' + sorted(values).join(', ') + '}';

  // Every subset of the set, smallest first. The empty set comes first.
  function powerSet(set) {
    const items = sorted(set);
    const subsets = [];
    for (let mask = 0; mask < 2 ** items.length; mask++) {
      subsets.push(items.filter((_, index) => mask & (1 << index)));
    }
    return subsets.sort((x, y) => x.length - y.length);
  }

  function powerCard(label, set) {
    const n = set.size;
    const total = n <= 30 ? 2 ** n : null;
    const count = total === null ? `2<sup>${n}</sup>` : `${total} subset${total === 1 ? '' : 's'}`;
    const title = `<h3>Power set P(${label}) <small>${count}</small></h3>`;
    if (n > POWER_LIMIT) {
      return `<div class="set-card">${title}<p class="hint">Too many subsets to list. The limit is ${POWER_LIMIT} elements.</p></div>`;
    }
    const chips = powerSet(set).map((subset) => `<span>${subset.length ? '{' + esc(subset.join(', ')) + '}' : '∅'}</span>`).join('');
    return `<div class="set-card">${title}<div class="power-set">${chips}</div></div>`;
  }

  // Ordered pairs (x, y) with x from the left set and y from the right set.
  function productCard(leftName, rightName, left, right) {
    const total = left.size * right.size;
    const title = `<h3>Cartesian product ${leftName} × ${rightName} <small>${total} pair${total === 1 ? '' : 's'}</small></h3>`;
    if (total > PRODUCT_LIMIT) {
      return `<div class="set-card">${title}<p class="hint">Too many pairs to list. The limit is ${PRODUCT_LIMIT}.</p></div>`;
    }
    const rightItems = sorted(right);
    const pairs = sorted(left).flatMap((x) => rightItems.map((y) => `<span>(${esc(x)}, ${esc(y)})</span>`));
    return `<div class="set-card">${title}<div class="chip-list">${pairs.join('') || '<span>∅</span>'}</div></div>`;
  }

  function analyzeSets() {
    const A = parse(setInputs.a.value);
    const B = parse(setInputs.b.value);

    if (!A.size && !B.size) {
      setInputs.output.innerHTML = '<p class="hint">Enter at least one set.</p>';
      return;
    }

    const operations = [
      ['Set A', format(A)],
      ['Set B', format(B)],
      ['Union (A ∪ B)', format(new Set([...A, ...B]))],
      ['Intersection (A ∩ B)', format(new Set([...A].filter((value) => B.has(value))))],
      ['Difference (A − B)', format(new Set([...A].filter((value) => !B.has(value))))],
      ['Difference (B − A)', format(new Set([...B].filter((value) => !A.has(value))))],
      ['Symmetric difference (A Δ B)', format(new Set([...A, ...B].filter((value) => A.has(value) !== B.has(value))))],
      ['|A| / |B|', `${A.size} / ${B.size}`]
    ];

    setInputs.output.innerHTML = table(operations) + productCard('A', 'B', A, B) + productCard('B', 'A', B, A) + powerCard('A', A) + powerCard('B', B);
  }

  setInputs.run.addEventListener('click', analyzeSets);
  [setInputs.a, setInputs.b].forEach((input) =>
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') analyzeSets(); }));
}
