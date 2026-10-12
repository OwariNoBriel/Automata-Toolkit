// Sets tab. Python does every set operation; this file only sends the sets and shows the answers.
const setSection = document.getElementById('page-set'); // the whole Sets page
if (setSection) { // only run when this page exists in the HTML
  const esc = (value) => String(value) // makes text safe to put inside HTML
    .replace(/&/g, '&amp;') // & becomes &amp;
    .replace(/</g, '&lt;') // < becomes &lt;
    .replace(/>/g, '&gt;') // > becomes &gt;
    .replace(/"/g, '&quot;'); // " becomes &quot;

  function show(answer) { // true/false answers are shown as Yes/No
    if (answer === true) return 'Yes'; // true becomes Yes
    if (answer === false) return 'No'; // false becomes No
    return answer; // everything else is shown as it is
  }

  function table(rows) { // turn [label, answer] rows into an HTML table
    let html = '<table>'; // start the table
    for (const [label, answer] of rows) { // one table row per pair
      html += `<tr><th>${esc(label)}</th><td>${esc(show(answer))}</td></tr>`; // a label cell and an answer cell
    }
    return html + '</table>'; // close the table
  }

  const setInputs = { // the page elements we talk to
    a: document.getElementById('set-a'), // Set A box
    b: document.getElementById('set-b'), // Set B box
    run: document.getElementById('set-run'), // the Run button
    output: document.getElementById('set-output') // where results appear
  };

  function productCard(product) { // one Cartesian product card
    const plural = product.count === 1 ? '' : 's'; // "1 pair" but "4 pairs"
    let html = `<div class="set-card"><h3>Cartesian product ${product.name} <small>${product.count} pair${plural}</small></h3>`; // card and title
    if (product.pairs === null) { // Python decided there are too many pairs to list
      html += `<p class="hint">Too many pairs to list. The limit is ${product.limit}.</p>`; // say so
    } else if (product.pairs.length === 0) { // an empty set gives no pairs
      html += '<div class="chip-list"><span>∅</span></div>'; // show the empty-set sign
    } else { // there are pairs to show
      html += '<div class="chip-list">'; // start the row of chips
      for (const [x, y] of product.pairs) { // one chip per ordered pair
        html += `<span>(${esc(x)}, ${esc(y)})</span>`; // written as (x, y)
      }
      html += '</div>'; // end the row of chips
    }
    return html + '</div>'; // close the card
  }

  function powerCard(power) { // one power set card
    let count = `2<sup>${power.n}</sup>`; // a huge count is written as 2 to the power n
    if (power.count !== null) { // Python sent a normal number
      count = `${power.count} subset${power.count === 1 ? '' : 's'}`; // "1 subset" but "8 subsets"
    }
    let html = `<div class="set-card"><h3>Power set P(${power.name}) <small>${count}</small></h3>`; // card and title
    if (power.subsets === null) { // Python decided there are too many subsets to list
      html += `<p class="hint">Too many subsets to list. The limit is ${power.limit} elements.</p>`; // say so
    } else { // there are subsets to show
      html += '<div class="power-set">'; // start the row of chips
      for (const subset of power.subsets) { // one chip per subset
        const label = subset.length === 0 ? '∅' : '{' + esc(subset.join(', ')) + '}'; // the empty set is written ∅
        html += `<span>${label}</span>`; // the chip
      }
      html += '</div>'; // end the row of chips
    }
    return html + '</div>'; // close the card
  }

  async function analyzeSets() { // send the sets to Python and show the result
    const response = await fetch('/api/sets', { // ask the server
      method: 'POST', // we are sending data
      headers: { 'Content-Type': 'application/json' }, // the data is JSON
      body: JSON.stringify({ a: setInputs.a.value, b: setInputs.b.value }) // the two typed sets
    });
    const data = await response.json(); // read the answer

    if (data.empty) { // nothing was typed
      setInputs.output.innerHTML = '<p class="hint">Enter at least one set.</p>'; // show a hint
      return; // nothing more to show
    }

    let html = table(data.table); // the operation rows
    for (const product of data.products) html += productCard(product); // A × B and B × A
    for (const power of data.powers) html += powerCard(power); // P(A) and P(B)
    setInputs.output.innerHTML = html; // put it all on the page
  }

  setInputs.run.addEventListener('click', analyzeSets); // run when the button is clicked
  for (const input of [setInputs.a, setInputs.b]) { // both set boxes
    input.addEventListener('keydown', (event) => { // when a key is pressed in one
      if (event.key === 'Enter') analyzeSets(); // the Enter key also runs
    });
  }
}
(() => {
  if (window.__setExprLoaded) return;
  window.__setExprLoaded = true;

  const $ = id => document.getElementById(id);
  const parseSet = s => new Set((s || '').split(/[,\s]+/).filter(Boolean));
  const sortItems = arr => arr.sort((x, y) =>
    isNaN(x - y) ? String(x).localeCompare(String(y)) : x - y);
  const show = s => '{' + sortItems([...s]).join(', ') + '}';

  const UNION = new Set(['u', '∪', '+']);
  const INTER = new Set(['n', '∩', '*']);
  const DIFF  = new Set(['-', '\\', '−']);
  const SYM   = new Set(['d', 'Δ', '△', '^']);

  const OPS = {
    union: (a, b) => new Set([...a, ...b]),
    inter: (a, b) => new Set([...a].filter(x => b.has(x))),
    diff:  (a, b) => new Set([...a].filter(x => !b.has(x))),
    sym:   (a, b) => new Set([...a, ...b].filter(x => a.has(x) !== b.has(x))),
  };

  function tokenize(src) {
    const out = [];
    for (const ch of src.replace(/\s+/g, '')) {
      const c = ch.toLowerCase();
      if (c === '(' || c === ')') out.push({ t: ch });
      else if (c === 'a' || c === 'b') out.push({ t: 'set', v: c });
      else if (UNION.has(c) || UNION.has(ch)) out.push({ t: 'op', v: 'union' });
      else if (INTER.has(c) || INTER.has(ch)) out.push({ t: 'op', v: 'inter' });
      else if (DIFF.has(ch)) out.push({ t: 'op', v: 'diff' });
      else if (SYM.has(c) || SYM.has(ch)) out.push({ t: 'op', v: 'sym' });
      else throw Error(`Unknown symbol "${ch}"`);
    }
    return out;
  }

  // all operators have equal precedence, evaluated left to right
  function evaluate(src, sets) {
    const toks = tokenize(src);
    let i = 0;

    function operand() {
      const tk = toks[i++];
      if (!tk) throw Error('Expression ended too early');
      if (tk.t === 'set') return sets[tk.v];
      if (tk.t === '(') {
        const v = chain();
        if (!toks[i] || toks[i].t !== ')') throw Error('Missing closing )');
        i++;
        return v;
      }
      throw Error('Expected a set or "("');
    }
    function chain() {
      let left = operand();
      while (toks[i] && toks[i].t === 'op') {
        const op = toks[i++].v;
        left = OPS[op](left, operand());
      }
      return left;
    }

    const result = chain();
    if (i < toks.length) throw Error(toks[i].t === ')' ? 'Extra )' : 'Missing operator between sets');
    return result;
  }

  function run() {
    const box = $('set-expr');
    const out = $('set-expr-out');
    if (!box || !out) return;
    const src = box.value.trim();
    if (!src) { out.innerHTML = '<p class="hint">Type an expression using A and B.</p>'; return; }
    try {
      const sets = { a: parseSet($('set-a').value), b: parseSet($('set-b').value) };
      const r = evaluate(src, sets);
      out.innerHTML =
        `<table><tr><th>Expression</th><td>${src.replace(/</g, '&lt;')}</td></tr>` +
        `<tr><th>Result</th><td>${show(r)}</td></tr>` +
        `<tr><th>Size</th><td>${r.size}</td></tr></table>`;
    } catch (e) {
      out.innerHTML = `<p class="no">${e.message}</p>`;
    }
  }

  document.addEventListener('input', e => {
    if (['set-expr', 'set-a', 'set-b'].includes(e.target.id)) run();
  });
  document.addEventListener('click', e => {
    if (e.target.closest('#set-run')) run();
  });
})();