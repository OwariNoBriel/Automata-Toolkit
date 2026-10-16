(() => {
  if (window.__setToolLoaded) return;       // avoid double listeners
  window.__setToolLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const SEP = /[,\s]+/;
  const parseSet = s => new Set((s || '').split(SEP).filter(Boolean));
  const sortItems = arr => arr.sort((x, y) =>
    isNaN(x - y) ? String(x).localeCompare(String(y)) : x - y);
  const show = s => '{' + sortItems([...s]).join(', ') + '}';
  const yn = b => (b ? 'Yes' : 'No');

  const POWER_LIMIT = 10;     // list the power set only up to 10 elements
  const PRODUCT_LIMIT = 200;  // list a Cartesian product only up to 200 pairs

  /* ---------- Set A / Set B boxes: {  1, 2, 3  } with commas added for you ---------- */
  function tidy(input, typedInsert) {
    const v = input.value;
    const caret = input.selectionStart;
    const parts = v.split(SEP).filter(Boolean);
    // a separator typed at the end becomes ", " so you can keep typing (not when deleting)
    const out = parts.join(', ') + (typedInsert && parts.length && SEP.test(v.slice(-1)) ? ', ' : '');
    if (out === v) return;
    const before = v.slice(0, caret).replace(/[,\s]/g, '').length; // characters (not separators) before the caret
    input.value = out;
    let pos = 0, seen = 0;
    while (pos < out.length && seen < before) { if (!/[,\s]/.test(out[pos])) seen++; pos++; }
    if (caret >= v.length) pos = out.length;
    input.setSelectionRange(pos, pos);
  }

  /* ---------- expression evaluator (uses the original A and B) ---------- */
  const OPS = {
    union: { sym: '∪', fn: (a, b) => new Set([...a, ...b]) },
    inter: { sym: '∩', fn: (a, b) => new Set([...a].filter(x => b.has(x))) },
    diff:  { sym: '−', fn: (a, b) => new Set([...a].filter(x => !b.has(x))) },
    sym:   { sym: 'Δ', fn: (a, b) => new Set([...a, ...b].filter(x => a.has(x) !== b.has(x))) },
  };
  const UNION = new Set(['u', '∪', '+']);
  const INTER = new Set(['n', '∩', '*']);
  const DIFF  = new Set(['-', '\\', '−', '–']);
  const SYM   = new Set(['d', 'Δ', '△', '^']);

  function tokenize(src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      const c = ch.toLowerCase();
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '{') {                                   // a set written directly, e.g. {1, 2}
        const end = src.indexOf('}', i);
        if (end < 0) throw Error('Missing closing }');
        const set = parseSet(src.slice(i + 1, end));
        out.push({ t: 'set', set, name: show(set) });
        i = end + 1;
        continue;
      }
      if (ch === '(' || ch === ')') out.push({ t: ch });
      else if (c === 'a' || c === 'b') out.push({ t: 'set', v: c, name: c.toUpperCase() });
      else if (UNION.has(c) || UNION.has(ch)) out.push({ t: 'op', v: 'union' });
      else if (INTER.has(c) || INTER.has(ch)) out.push({ t: 'op', v: 'inter' });
      else if (DIFF.has(ch)) out.push({ t: 'op', v: 'diff' });
      else if (SYM.has(c) || SYM.has(ch)) out.push({ t: 'op', v: 'sym' });
      else throw Error(`Unknown symbol "${ch}"`);
      i++;
    }
    return out;
  }

  // all operators have equal precedence, evaluated left to right; records each step
  function evaluate(src, sets) {
    const toks = tokenize(src);
    const steps = [];
    let i = 0;

    function operand() {
      const tk = toks[i++];
      if (!tk) throw Error('Expression ended too early');
      if (tk.t === 'set') return { s: tk.set || sets[tk.v], name: tk.name };
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
        const op = OPS[toks[i++].v];
        const right = operand();
        const label = `${left.name} ${op.sym} ${right.name}`;
        const s = op.fn(left.s, right.s);
        steps.push({ label, value: s });
        left = { s, name: `(${label})` };
      }
      return left;
    }

    if (!toks.length) throw Error('');
    const result = chain();
    if (i < toks.length) throw Error(toks[i].t === ')' ? 'Extra )' : 'Missing operator between sets');
    return { set: result.s, steps };
  }

  /* ---------- power set and Cartesian product ---------- */
  function powerHtml(cur) {
    const items = sortItems([...cur]);
    const n = items.length;
    const count = n <= 30 ? String(2 ** n) : `2<sup>${n}</sup>`;
    const head = `<b>P(Result)</b> — ${count} subset${n === 0 ? '' : 's'}`;
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
  let activeList = null;  // 'power' | 'prodAB' | 'prodBA' | null

  function render() {
    if (!$('set-a') || !$('set-expr')) return;
    const a = parseSet($('set-a').value);
    const b = parseSet($('set-b').value);
    const src = $('set-expr').value.trim();

    // the expression
    let result = null, steps = [], err = '';
    if (src) {
      try { ({ set: result, steps } = evaluate(src, { a, b })); }
      catch (e) { err = e.message; }
    }
    $('set-err').textContent = err;
    $('set-out').textContent = result ? show(result) : '—';

    $('set-steps').innerHTML = steps.length
      ? '<table><tr><th>Step</th><th>Value</th><th>Size</th></tr>' +
        steps.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(show(r.value))}</td><td>${r.value.size}</td></tr>`).join('') + '</table>'
      : '<p class="hint small">Build an expression with at least one operator to see each step.</p>';

    $('set-cur').textContent   = result ? show(result) : '—';
    $('set-size').textContent  = result ? result.size : '—';
    $('set-sizes').textContent = `${a.size} / ${b.size}`;
    $('set-sub').textContent   = yn([...a].every(x => b.has(x)));
    $('set-sup').textContent   = yn([...b].every(x => a.has(x)));
    $('set-disj').textContent  = yn([...a].every(x => !b.has(x)));

    document.querySelectorAll('#set-lists [data-list]').forEach(btn =>
      btn.setAttribute('aria-pressed', String(btn.dataset.list === activeList)));
    const box = $('set-info');
    if (activeList === 'power')       box.innerHTML = result ? powerHtml(result) : '<b>P(Result)</b> — build an expression first.';
    else if (activeList === 'prodAB') box.innerHTML = productHtml(a, b, 'A × B');
    else if (activeList === 'prodBA') box.innerHTML = productHtml(b, a, 'B × A');
    box.hidden = !activeList;
  }

  /* ---------- the symbol buttons put text into the expression at the cursor ---------- */
  function insertAtCursor(text) {
    const el = $('set-expr');
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    const pos = text === '{}' ? s + 1 : s + text.length;   // put the cursor inside { }
    el.focus();
    el.setSelectionRange(pos, pos);
    render();
  }
  function backspace() {
    const el = $('set-expr');
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    let from = s;
    if (s !== e) from = s;                                   // something is selected: remove just that
    else {
      const m = el.value.slice(0, s).match(/ ?[∪∩−Δ] ?$|[\s\S]$/);  // a whole " ∪ " goes at once, otherwise one character
      from = m ? s - m[0].length : s;
    }
    el.value = el.value.slice(0, from) + el.value.slice(e);
    el.focus();
    el.setSelectionRange(from, from);
    render();
  }

  /* ---------- events (delegated, so load order doesn't matter) ---------- */
  document.addEventListener('click', e => {
    const ins = e.target.closest('#page-set [data-ins]');
    if (ins) { insertAtCursor(ins.dataset.ins); return; }
    const act = e.target.closest('#page-set [data-act]');
    if (act) {
      if (act.dataset.act === 'back') backspace();
      if (act.dataset.act === 'clear') { $('set-expr').value = ''; $('set-expr').focus(); render(); }
      return;
    }
    const list = e.target.closest('#set-lists [data-list]');
    if (list) {
      activeList = activeList === list.dataset.list ? null : list.dataset.list; // click again to hide
      render();
    }
  });
  document.addEventListener('input', e => {
    if (e.target.classList && e.target.classList.contains('set-in')) {
      tidy(e.target, !(e.inputType || '').startsWith('delete'));
      render();
    }
    if (e.target.id === 'set-expr') render();
  });

  render();
})();
