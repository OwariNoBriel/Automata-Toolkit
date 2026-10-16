(() => {
  if (window.__setToolLoaded) return;       // avoid double listeners
  window.__setToolLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const parseSet = s => new Set((s || '').split(/[,\s]+/).filter(Boolean));
  const sortItems = arr => arr.sort((x, y) =>
    isNaN(x - y) ? String(x).localeCompare(String(y)) : x - y);
  const show = s => '{' + sortItems([...s]).join(', ') + '}';
  const yn = b => (b ? 'Yes' : 'No');

  const POWER_LIMIT = 10;     // list the power set only up to 10 elements
  const PRODUCT_LIMIT = 200;  // list a Cartesian product only up to 200 pairs

  /* ---------- the operations (each takes the current set and B) ---------- */
  const OPS = {
    union:  { label: 'Union (A ∪ B)',          fn: (a, b) => new Set([...a, ...b]) },
    inter:  { label: 'Intersection (A ∩ B)',   fn: (a, b) => new Set([...a].filter(x => b.has(x))) },
    diffAB: { label: 'Difference (A − B)',     fn: (a, b) => new Set([...a].filter(x => !b.has(x))) },
    diffBA: { label: 'Difference (B − A)',     fn: (a, b) => new Set([...b].filter(x => !a.has(x))) },
    sym:    { label: 'Symmetric diff (A Δ B)', fn: (a, b) => new Set([...a, ...b].filter(x => a.has(x) !== b.has(x))) },
  };

  let pipeline = [];      // operations clicked so far (replayed from Set A every time, so A and B stay live)
  let activeList = null;  // 'power' | 'prodAB' | 'prodBA' | null

  /* ---------- power set and Cartesian product ---------- */
  function powerHtml(cur) {
    const items = sortItems([...cur]);
    const n = items.length;
    const count = n <= 30 ? String(2 ** n) : `2<sup>${n}</sup>`;
    const head = `<b>P(current)</b> — ${count} subset${n === 0 ? '' : 's'}`;
    if (n > POWER_LIMIT) return `${head}<br>Too many subsets to list. The limit is ${POWER_LIMIT} elements.`;
    let subsets = [[]];
    for (const x of items) subsets = subsets.concat(subsets.map(s => [...s, x]));
    subsets.sort((p, q) => p.length - q.length);   // smallest subsets first (sort is stable)
    return head + '<div class="chip-list">' +
      subsets.map(s => `<span>${s.length ? '{' + esc(s.join(', ')) + '}' : '∅'}</span>`).join('') + '</div>';
  }

  function productHtml(left, right, name) {
    const l = sortItems([...left]), r = sortItems([...right]);
    const total = l.length * r.length;
    const head = `<b>${name}</b> — ${total} pair${total === 1 ? '' : 's'}`;
    if (total > PRODUCT_LIMIT) return `${head}<br>Too many pairs to list. The limit is ${PRODUCT_LIMIT}.`;
    if (total === 0) return `${head}<div class="chip-list"><span>∅</span></div>`;
    const pairs = [];
    for (const x of l) for (const y of r) pairs.push(`<span>(${esc(x)}, ${esc(y)})</span>`);
    return head + '<div class="chip-list">' + pairs.join('') + '</div>';
  }

  /* ---------- draw everything ---------- */
  function render() {
    if (!$('set-a') || !$('set-steps')) return;
    const a = parseSet($('set-a').value);
    const b = parseSet($('set-b').value);
    let cur = a;
    const rows = [{ label: 'Start (Set A)', value: cur }];
    for (const key of pipeline) {
      cur = OPS[key].fn(cur, b);
      rows.push({ label: OPS[key].label, value: cur });
    }

    $('set-out').textContent = show(cur);

    $('set-steps').innerHTML =
      '<tr><th>Step</th><th>Value</th><th>Size</th></tr>' +
      rows.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(show(r.value))}</td><td>${r.value.size}</td></tr>`).join('');

    $('set-cur').textContent  = show(cur);
    $('set-size').textContent = cur.size;
    $('set-sub').textContent  = yn([...cur].every(x => b.has(x)));
    $('set-sup').textContent  = yn([...b].every(x => cur.has(x)));
    $('set-disj').textContent = yn([...cur].every(x => !b.has(x)));

    document.querySelectorAll('#set-lists [data-list]').forEach(btn =>
      btn.setAttribute('aria-pressed', String(btn.dataset.list === activeList)));
    const box = $('set-info');
    if (activeList === 'power')       box.innerHTML = powerHtml(cur);
    else if (activeList === 'prodAB') box.innerHTML = productHtml(cur, b, 'current × B');
    else if (activeList === 'prodBA') box.innerHTML = productHtml(b, cur, 'B × current');
    box.hidden = !activeList;

    runExpr();
  }

  /* ---------- expression evaluator (uses the original A and B) ---------- */
  const UNION = new Set(['u', '∪', '+']);
  const INTER = new Set(['n', '∩', '*']);
  const DIFF  = new Set(['-', '\\', '−']);
  const SYM   = new Set(['d', 'Δ', '△', '^']);
  const EXPR_OPS = { union: OPS.union.fn, inter: OPS.inter.fn, diff: OPS.diffAB.fn, sym: OPS.sym.fn };

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
        left = EXPR_OPS[op](left, operand());
      }
      return left;
    }
    const result = chain();
    if (i < toks.length) throw Error(toks[i].t === ')' ? 'Extra )' : 'Missing operator between sets');
    return result;
  }

  function runExpr() {
    const box = $('set-expr');
    const out = $('set-expr-out');
    if (!box || !out) return;
    const src = box.value.trim();
    if (!src) { out.innerHTML = '<p class="hint">Type an expression using A and B.</p>'; return; }
    try {
      const r = evaluate(src, { a: parseSet($('set-a').value), b: parseSet($('set-b').value) });
      out.innerHTML =
        `<div class="kv"><span>Expression</span><b>${esc(src)}</b></div>` +
        `<div class="kv"><span>Result</span><b>${esc(show(r))}</b></div>` +
        `<div class="kv"><span>Size</span><b>${r.size}</b></div>`;
    } catch (e) {
      out.innerHTML = `<p class="err">${esc(e.message)}</p>`;
    }
  }

  /* ---------- events (delegated, so load order doesn't matter) ---------- */
  document.addEventListener('click', e => {
    const op = e.target.closest('#set-ops [data-op]');
    if (op) { pipeline.push(op.dataset.op); render(); return; }
    const list = e.target.closest('#set-lists [data-list]');
    if (list) {
      activeList = activeList === list.dataset.list ? null : list.dataset.list; // click again to hide
      render();
      return;
    }
    if (e.target.closest('#set-undo'))  { pipeline.pop(); render(); }
    if (e.target.closest('#set-reset')) { pipeline = []; render(); }
  });
  document.addEventListener('input', e => {
    if (['set-a', 'set-b', 'set-expr'].includes(e.target.id)) render();
  });

  render();
})();
