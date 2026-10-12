const regexSection = document.getElementById('page-regex');
if (regexSection) {
  const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

  const regexInputs = {
    expr: document.getElementById('regex-input'),
    max: document.getElementById('regex-max'),
    maxValue: document.getElementById('regex-max-value'),
    chips: document.getElementById('regex-chips'),
    output: document.getElementById('regex-output')
  };

  const EXAMPLES = ['A+BC', 'A*B', '(AB)+', 'A|BC', '(A|B)*C', '(AB|C)+D', 'A(B|C)*'];
  let timer = null;
  let latest = 0;

  function renderRegex(data) {
    const groups = {};
    data.words.forEach((word) => (groups[word.length] = groups[word.length] || []).push(word));
    const rows = Object.keys(groups).map((len) =>
      `<div class="regex-group"><b>${len === '0' ? 'empty' : 'length ' + len}</b><div class="regex-words">` +
      groups[len].map((word) => `<span>${word === '' ? 'ε' : esc(word)}</span>`).join('') +
      '</div></div>').join('');
    const plural = data.count === 1 ? '' : 's';
    const empty = data.words.includes('') ? ' (ε = the empty string)' : '';
    return `<p class="regex-read">${esc(data.read)}</p>` +
      `<p class="regex-meta">${data.count}${data.capped ? '+' : ''} string${plural} up to length ${data.max_len}${empty}</p>` +
      (rows || `<p class="regex-meta">No strings fit within length ${data.max_len}. Try a larger max length.</p>`);
  }

  async function analyzeRegex() {
    const mine = ++latest;
    regexInputs.maxValue.textContent = regexInputs.max.value;
    if (!regexInputs.expr.value.trim()) {
      regexInputs.output.innerHTML = '<p class="hint">Type an expression to begin.</p>';
      return;
    }
    const response = await fetch('/api/regex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regex: regexInputs.expr.value, max_len: Number(regexInputs.max.value) })
    });
    const data = await response.json();
    if (mine !== latest) return;
    regexInputs.output.innerHTML = (!response.ok || data.error)
      ? `<p class="regex-error">${esc(data.error || 'Something went wrong.')}</p>`
      : renderRegex(data);
  }

  function scheduleRegex() {
    clearTimeout(timer);
    timer = setTimeout(analyzeRegex, 150);
  }

  EXAMPLES.forEach((example) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = example;
    chip.addEventListener('click', () => {
      regexInputs.expr.value = example;
      analyzeRegex();
    });
    regexInputs.chips.appendChild(chip);
  });
  regexInputs.expr.addEventListener('input', scheduleRegex);
  regexInputs.max.addEventListener('input', scheduleRegex);
  analyzeRegex();
}