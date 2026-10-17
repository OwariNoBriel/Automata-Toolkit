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
  const DIFF = new Set(['-', '\\', '−', '–']);

  function tokenize(src, sets) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
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
      else if (ch === 'u' || ch === '∪' || ch === '+') out.push({ t: 'op', v: 'union' });
      else if (ch === 'n' || ch === '∩' || ch === '*') out.push({ t: 'op', v: 'inter' });
      else if (DIFF.has(ch)) out.push({ t: 'op', v: 'diff' });
      else if (ch === 'd' || ch === 'Δ' || ch === '△' || ch === '^') out.push({ t: 'op', v: 'sym' });
      else if (/[a-z]/i.test(ch)) {                       // any other letter is a set name
        const name = ch.toUpperCase();
        if (!sets[name]) throw Error(`Set ${name} doesn't exist. Use "+ Add set" first.`);
        out.push({ t: 'set', v: name, name });
      }
      else throw Error(`Unknown symbol "${ch}"`);
      i++;
    }
    return out;
  }

  // all operators have equal precedence, evaluated left to right; records each step
  function evaluate(src, sets) {
    const toks = tokenize(src, sets);
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

  /* ---------- power set and Cartesian product (always shown with the Result they come from) ---------- */
  const basis = (...parts) => '<div class="basis">Based on ' + parts.join(' and ') + '</div>';

  function powerHtml(cur) {
    const items = sortItems([...cur]);
    const n = items.length;
    const count = n <= 30 ? String(2 ** n) : `2<sup>${n}</sup>`;
    const head = basis(`<b>Result</b> = ${esc(show(cur))}`) +
      `<b>P(Result)</b> — ${count} subset${n === 0 ? '' : 's'}`;
    if (n > POWER_LIMIT) return `${head}<br>Too many subsets to list. The limit is ${POWER_LIMIT} elements.`;
    let subsets = [[]];
    for (const x of items) subsets = subsets.concat(subsets.map(s => [...s, x]));
    subsets.sort((p, q) => p.length - q.length);   // smallest subsets first (sort is stable)
    return head + '<div class="chip-list">' +
      subsets.map(s => `<span>${s.length ? '{' + esc(s.join(', ')) + '}' : '∅'}</span>`).join('') + '</div>';
  }

  function productHtml(left, right, name, based) {
    const l = sortItems([...left]), r = sortItems([...right]);
    const total = l.length * r.length;
    const head = basis(...based) + `<b>${name}</b> — ${total} pair${total === 1 ? '' : 's'}`;
    if (total > PRODUCT_LIMIT) return `${head}<br>Too many pairs to list. The limit is ${PRODUCT_LIMIT}.`;
    if (total === 0) return `${head}<div class="chip-list"><span>∅</span></div>`;
    const pairs = [];
    for (const x of l) for (const y of r) pairs.push(`<span>(${esc(x)}, ${esc(y)})</span>`);
    return head + '<div class="chip-list">' + pairs.join('') + '</div>';
  }

  /* ---------- the sets themselves: A and B to start, up to F ---------- */
  const MAX_SETS = 6;
  const names = ['A', 'B'];
  let activeList = null;  // 'power' | 'prodRX' | 'prodXR' | null

  function getSets() {
    const sets = {};
    for (const n of names) sets[n] = parseSet($('set-' + n.toLowerCase()).value);
    return sets;
  }

  function rebuildControls() {
    $('set-name-btns').innerHTML = names.map(n => `<button data-ins="${n}">${n}</button>`).join('');
    const sel = $('set-pair');
    const keep = names.includes(sel.value) ? sel.value : 'B';
    sel.innerHTML = names.map(n => `<option value="${n}">Set ${n}</option>`).join('');
    sel.value = keep;
    $('set-add').disabled = names.length >= MAX_SETS;
    $('set-remove').disabled = names.length <= 2;
  }

  function addSet() {
    if (names.length >= MAX_SETS) return;
    const n = 'ABCDEF'[names.length];
    const id = 'set-' + n.toLowerCase();
    const field = document.createElement('div');
    field.className = 'field';
    field.id = id + '-field';
    field.innerHTML = `<label for="${id}">Set ${n}</label>` +
      `<div class="brace-input"><span>{</span><input id="${id}" class="set-in" placeholder="e.g. 5, 6" autocomplete="off"><span>}</span></div>`;
    $('set-fields').appendChild(field);
    names.push(n);
    rebuildControls();
    render();
    $(id).focus();
  }

  function removeSet() {
    if (names.length <= 2) return;
    const n = names.pop();
    const field = $('set-' + n.toLowerCase() + '-field');
    if (field) field.remove();
    rebuildControls();
    render();
  }

  /* ---------- draw everything ---------- */
  function render() {
    if (!$('set-a') || !$('set-expr')) return;
    const sets = getSets();
    const a = sets.A, b = sets.B;
    const src = $('set-expr').value.trim();

    // the expression
    let result = null, steps = [], err = '';
    if (src) {
      try { ({ set: result, steps } = evaluate(src, sets)); }
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
    $('set-sizes').textContent = names.map(n => `|${n}| = ${sets[n].size}`).join(',  ');
    $('set-sub').textContent   = yn([...a].every(x => b.has(x)));
    $('set-sup').textContent   = yn([...b].every(x => a.has(x)));
    $('set-disj').textContent  = yn([...a].every(x => !b.has(x)));

    // power set / product buttons, always based on the Result
    const other = $('set-pair').value || 'B';
    $('set-prod-rx').textContent = `Result × ${other}`;
    $('set-prod-xr').textContent = `${other} × Result`;
    document.querySelectorAll('#set-lists [data-list]').forEach(btn =>
      btn.setAttribute('aria-pressed', String(btn.dataset.list === activeList)));
    const box = $('set-info');
    const resultPart = result ? `<b>Result</b> = ${esc(show(result))}` : '';
    const otherPart = `<b>${other}</b> = ${esc(show(sets[other] || new Set()))}`;
    if (!activeList)                  box.innerHTML = '';
    else if (!result)                 box.innerHTML = 'Build an expression first. The Result is what these are based on.';
    else if (activeList === 'power')  box.innerHTML = powerHtml(result);
    else if (activeList === 'prodRX') box.innerHTML = productHtml(result, sets[other], `Result × ${other}`, [resultPart, otherPart]);
    else if (activeList === 'prodXR') box.innerHTML = productHtml(sets[other], result, `${other} × Result`, [otherPart, resultPart]);
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
    if (e.target.closest('#set-add'))    { addSet(); return; }
    if (e.target.closest('#set-remove')) { removeSet(); return; }
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
  document.addEventListener('change', e => {
    if (e.target.id === 'set-pair') render();
  });

  rebuildControls();
  render();
})();
