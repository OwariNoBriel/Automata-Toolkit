(() => {
  if (window.__textToolLoaded) return;      // avoid double listeners
  window.__textToolLoaded = true;

  const $ = id => document.getElementById(id);
  const dash = s => (s === '' ? '—' : s);

  // Operations that change the text. Each one takes the current text (and B) and returns the new text.
  const OPS = {
    concat:  (v, b) => v + b,
    reverse: v => [...v].reverse().join(''),
    upper:   v => v.toUpperCase(),
    lower:   v => v.toLowerCase(),
  };

  // Operations that only list something about the current text (they don't change it).
  const LISTS = {
    prefixes: chars => chars.map((_, i) => chars.slice(0, i + 1).join('')),
    suffixes: chars => chars.map((_, i) => chars.slice(chars.length - 1 - i).join('')),
  };

  let current = '';   // the text shown in the output box
  let history = [];   // earlier values, so Undo works

  function show(info) {
    if (!$('textOut')) return;
    $('textOut').textContent = dash(current);
    const box = $('textInfo');
    box.hidden = !info;
    box.textContent = info || '';
  }

  function syncFromA() {          // Text A changed: start over from what was typed
    current = $('textA').value;
    history = [];
    show();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('#ops [data-op]');
    if (btn) {
      const op = btn.dataset.op;
      if (OPS[op]) {
        history.push(current);
        current = OPS[op](current, $('textB').value);
        show();
      } else if (LISTS[op]) {
        const items = LISTS[op]([...current]);
        show(items.length ? `${btn.textContent}: ${items.join(', ')}` : `${btn.textContent}: —`);
      }
      return;
    }
    if (e.target.closest('#undo'))  { if (history.length) current = history.pop(); show(); }
    if (e.target.closest('#reset')) { syncFromA(); }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'textA') syncFromA();
  });

  show();
})();
