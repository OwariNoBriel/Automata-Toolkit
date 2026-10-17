(() => {
  if (window.__textToolLoaded) return;      // avoid double listeners
  window.__textToolLoaded = true;

  const $ = id => document.getElementById(id);
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const dash = s => (s === '' ? '—' : s);

  // Operations that change the text. Each takes the current text (and B) and returns the new text.
  const OPS = {
    concatAB: { label: 'Concat (A + B)', fn: (v, b) => v + b },
    concatBA: { label: 'Concat (B + A)', fn: (v, b) => b + v },
    reverse:  { label: 'Reverse',        fn: v => [...v].reverse().join('') },
    upper:    { label: 'Uppercase',      fn: v => v.toUpperCase() },
    lower:    { label: 'Lowercase',      fn: v => v.toLowerCase() },
  };

  // Lists about the current text (they don't change it).
  const LISTS = {
    prefixes: chars => chars.map((_, i) => chars.slice(0, i + 1).join('')),
    suffixes: chars => chars.map((_, i) => chars.slice(chars.length - 1 - i).join('')),
  };

  let pipeline = [];      // the operations clicked so far (replayed from Text A every time, so B stays live)
  let activeList = null;  // 'prefixes' | 'suffixes' | null

  function render() {
    if (!$('textA') || !$('steps')) return;
    const b = $('textB').value;
    let v = $('textA').value;
    const rows = [{ label: 'Start (Text A)', value: v }];
    for (const key of pipeline) {
      v = OPS[key].fn(v, b);
      rows.push({ label: OPS[key].label, value: v });
    }
    const chars = [...v];

    $('textOut').textContent = dash(v);

    $('steps').innerHTML =
      '<tr><th>Step</th><th>Value</th><th>Length</th></tr>' +
      rows.map(r => `<tr><td>${r.label}</td><td>${esc(dash(r.value))}</td><td>${[...r.value].length}</td></tr>`).join('');

    $('outCurrent').textContent = dash(v);
    $('outLength').textContent  = chars.length;
    $('outPal').textContent     = v === '' ? '—' : (v === [...chars].reverse().join('') ? 'Yes' : 'No');

    document.querySelectorAll('#lists [data-list]').forEach(btn =>
      btn.setAttribute('aria-pressed', String(btn.dataset.list === activeList)));
    const box = $('textInfo');
    if (activeList) {
      const items = LISTS[activeList](chars);
      box.textContent = items.length ? items.join(', ') : '—';
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  /* ---------- restore original string from prefixes / suffixes ---------- */
  const MODES = {
    prefix: { hint: 'e.g. a, ab, abc',  test: (whole, p) => whole.startsWith(p) },
    suffix: { hint: 'e.g. c, bc, abc',  test: (whole, p) => whole.endsWith(p) },
  };

  function convert() {
    if (!$('convMode')) return;
    const kind = MODES[$('convMode').value] ? $('convMode').value : 'prefix';
    const m = MODES[kind];
    $('convIn').placeholder = m.hint;
    $('convErr').textContent = '';
    const parts = $('convIn').value.split(/[,\s]+/).filter(Boolean);
    if (!parts.length) { $('convOut').textContent = '—'; return; }
    const whole = parts.reduce((a, p) => (p.length > a.length ? p : a)); // longest piece = the original
    const bad = parts.find(p => !m.test(whole, p));
    if (bad) {
      $('convOut').textContent = '—';
      $('convErr').textContent = `"${bad}" is not a ${kind} of "${whole}".`;
    } else {
      $('convOut').textContent = whole;
    }
  }

  /* ---------- events (delegated, so load order doesn't matter) ---------- */
  document.addEventListener('click', e => {
    const op = e.target.closest('#ops [data-op]');
    if (op) { pipeline.push(op.dataset.op); render(); return; }
    const list = e.target.closest('#lists [data-list]');
    if (list) {
      activeList = activeList === list.dataset.list ? null : list.dataset.list; // click again to hide
      render();
      return;
    }
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

  render(); convert();
})();
