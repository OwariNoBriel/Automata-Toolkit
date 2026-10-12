(() => {
  if (window.__textToolLoaded) return;      // avoid double listeners
  window.__textToolLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const dash = s => (s === '' ? '—' : s);

  /* ---------- string pipeline ---------- */
  const OPS = {
    concat:  { label: 'Concat (+ B)', fn: (v, b) => v + b },
    reverse: { label: 'Reverse',      fn: v => [...v].reverse().join('') },
    upper:   { label: 'Uppercase',    fn: v => v.toUpperCase() },
    lower:   { label: 'Lowercase',    fn: v => v.toLowerCase() },
  };
  let pipeline = [];

  function render() {
    if (!$('textA') || !$('steps')) return;
    const b = $('textB').value;
    let v = $('textA').value;
    const rows = [{ label: 'Start (Text A)', value: v }];
    for (const key of pipeline) {
      v = OPS[key].fn(v, b);
      rows.push({ label: OPS[key].label, value: v });
    }
    $('steps').innerHTML =
      '<tr><th>Step</th><th>Value</th><th>Length</th></tr>' +
      rows.map(r => `<tr><td>${r.label}</td><td>${esc(dash(r.value))}</td><td>${[...r.value].length}</td></tr>`).join('');

    const chars = [...v];
    $('outCurrent').textContent  = dash(v);
    $('outLength').textContent   = chars.length;
    $('outPrefixes').textContent = dash(chars.map((_, i) => chars.slice(0, i + 1).join('')).join(', '));
    $('outSuffixes').textContent = dash(chars.map((_, i) => chars.slice(i).join('')).join(', '));
    $('outPal').textContent      = v === '' ? '—' : (v === [...chars].reverse().join('') ? 'Yes' : 'No');
  }

  /* ---------- notation converter ---------- */
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  const RIGHT = { '^': true };
  const isOp = t => t in PREC;
  const tokenize = s => s.match(/[A-Za-z0-9.]+|[-+*/^()]/g) || [];

  function fromPostfix(tokens) {
    const st = [];
    for (const x of tokens) {
      if (isOp(x)) {
        const r = st.pop(), l = st.pop();
        if (!l || !r) throw Error('Invalid postfix expression');
        st.push({ v: x, l, r });
      } else st.push({ v: x });
    }
    if (st.length !== 1) throw Error('Invalid postfix expression');
    return st[0];
  }
  function fromPrefix(tokens) {
    const st = [];
    for (const x of [...tokens].reverse()) {
      if (isOp(x)) {
        const l = st.pop(), r = st.pop();
        if (!l || !r) throw Error('Invalid prefix expression');
        st.push({ v: x, l, r });
      } else st.push({ v: x });
    }
    if (st.length !== 1) throw Error('Invalid prefix expression');
    return st[0];
  }
  function fromInfix(tokens) {
    const out = [], ops = [];
    for (const x of tokens) {
      if (isOp(x)) {
        while (ops.length) {
          const top = ops[ops.length - 1];
          if (isOp(top) && (PREC[top] > PREC[x] || (PREC[top] === PREC[x] && !RIGHT[x]))) out.push(ops.pop());
          else break;
        }
        ops.push(x);
      } else if (x === '(') ops.push(x);
      else if (x === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop());
        if (!ops.length) throw Error('Mismatched parentheses');
        ops.pop();
      } else out.push(x);
    }
    while (ops.length) {
      const o = ops.pop();
      if (o === '(') throw Error('Mismatched parentheses');
      out.push(o);
    }
    return fromPostfix(out);
  }
  function toInfix(n) {
    if (!n.l) return n.v;
    const p = PREC[n.v];
    const wrap = (c, isRight) => {
      const s = toInfix(c);
      if (!c.l) return s;
      const q = PREC[c.v];
      return (q < p || (q === p && isRight !== !!RIGHT[n.v])) ? `(${s})` : s;
    };
    return `${wrap(n.l, false)} ${n.v} ${wrap(n.r, true)}`;
  }
  const toPrefix  = n => n.l ? `${n.v} ${toPrefix(n.l)} ${toPrefix(n.r)}` : n.v;
  const toPostfix = n => n.l ? `${toPostfix(n.l)} ${toPostfix(n.r)} ${n.v}` : n.v;

  const MODES = {
    'post-in':  { parse: fromPostfix, emit: toInfix,   hint: 'a b + c *' },
    'in-pre':   { parse: fromInfix,   emit: toPrefix,  hint: '(a + b) * c' },
    'pre-post': { parse: fromPrefix,  emit: toPostfix, hint: '* + a b c' },
  };

  function convert() {
    if (!$('convMode')) return;
    const m = MODES[$('convMode').value];
    $('convIn').placeholder = m.hint;
    $('convErr').textContent = '';
    try {
      const tokens = tokenize($('convIn').value);
      $('convOut').textContent = tokens.length ? m.emit(m.parse(tokens)) : '—';
    } catch (e) {
      $('convOut').textContent = '—';
      $('convErr').textContent = e.message;
    }
  }

  /* ---------- events (delegated, so load order doesn't matter) ---------- */
  document.addEventListener('click', e => {
    const opBtn = e.target.closest('#ops [data-op]');
    if (opBtn) { pipeline.push(opBtn.dataset.op); render(); return; }
    if (e.target.closest('#undo'))  { pipeline.pop(); render(); }
    if (e.target.closest('#reset')) { pipeline = []; render(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'textA' || e.target.id === 'textB') render();
    if (e.target.id === 'convIn') convert();
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'convMode') convert();
  });

  // draw as soon as the template shows up in the page
  new MutationObserver(() => {
    const a = $('textA');
    if (a && !a.dataset.ready) { a.dataset.ready = '1'; render(); convert(); }
  }).observe(document.body, { childList: true, subtree: true });
  render(); convert();
})();