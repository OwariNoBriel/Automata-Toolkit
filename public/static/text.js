(() => {
  if (window.__textToolLoaded) return;      // avoid double listeners
  window.__textToolLoaded = true;

  const $ = id => document.getElementById(id);
  const dash = s => (s === '' ? '—' : s);

  // Operations that change the text. Each takes the current text (and B) and returns the new text.
  const OPS = {
    concatAB: (v, b) => v + b,
    concatBA: (v, b) => b + v,
    reverse:  v => [...v].reverse().join(''),
    upper:    v => v.toUpperCase(),
    lower:    v => v.toLowerCase(),
  };

  // Lists about the current text (they don't change it).
  const LISTS = {
    prefixes: chars => chars.map((_, i) => chars.slice(0, i + 1).join('')),
    suffixes: chars => chars.map((_, i) => chars.slice(chars.length - 1 - i).join('')),
  };

  let current = '';       // the text shown in the output box
  let history = [];       // earlier values, so Undo works
  let activeList = null;  // 'prefixes' | 'suffixes' | null

  function show() {
    if (!$('textOut')) return;
    $('textOut').textContent = dash(current);

    document.querySelectorAll('#lists [data-list]').forEach(btn =>
      btn.setAttribute('aria-pressed', String(btn.dataset.list === activeList)));

    const box = $('textInfo');
    if (activeList) {
      const items = LISTS[activeList]([...current]);
      box.textContent = items.length ? items.join(', ') : '—';
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  function syncFromA() {          // Text A changed: start over from what was typed
    current = $('textA').value;
    history = [];
    show();
  }

  document.addEventListener('click', e => {
    const op = e.target.closest('#ops [data-op]');
    if (op) {
      history.push(current);
      current = OPS[op.dataset.op](current, $('textB').value);
      show();
      return;
    }
    const list = e.target.closest('#lists [data-list]');
    if (list) {
      activeList = activeList === list.dataset.list ? null : list.dataset.list; // click again to hide
      show();
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
