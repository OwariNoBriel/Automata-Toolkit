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

    /* ---------- prefix / suffix restorer ---------- */
  function restore(text, kind) { // kind is 'prefix' or 'suffix'
    const parts = text.split(/[,\s]+/).filter(Boolean); // split on commas and spaces
    if (!parts.length) return '';
    const whole = parts.reduce((a, b) => (b.length > a.length ? b : a)); // longest piece = the original
    const bad = parts.find(p => !(kind === 'prefix' ? whole.startsWith(p) : whole.endsWith(p)));
    if (bad) throw Error(`"${bad}" is not a ${kind} of "${whole}".`);
    return whole;
  }

  const MODES = {
    'prefix-str': { kind: 'prefix' },
    'suffix-str': { kind: 'suffix' },
  };

  function convert() {
    if (!$('convMode')) return;
    const m = MODES[$('convMode').value];
    $('convIn').placeholder = m.hint;
    $('convErr').textContent = '';
    try {
      $('convOut').textContent = dash(restore($('convIn').value, m.kind));
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