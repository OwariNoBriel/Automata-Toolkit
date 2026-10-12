const textSection = document.getElementById('page-text');
if (textSection) {
  const esc = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\\': '&#92;' }[char]));
  const show = (value) => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  const table = (rows) => '<table>' + rows.map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(show(value))}</td></tr>`).join('') + '</table>';

  const textInputs = {
    a: document.getElementById('text-input-a'),
    b: document.getElementById('text-input-b'),
    prefix: document.getElementById('text-prefix'),
    suffix: document.getElementById('text-suffix'),
    analyze: document.getElementById('text-analyze'),
    combined: document.getElementById('text-output-combined'),
    results: document.getElementById('text-results-grid'),
    outputA: document.getElementById('text-output-a'),
    outputB: document.getElementById('text-output-b')
  };

  const reverse = (text) => Array.from(text).reverse().join('');

  // Ignores spaces and letter case. Needs at least 2 characters, so one character is not a palindrome.
  // Empty text is reported as "No text".
  function palindromeAnswer(text) {
    const clean = text.toLowerCase().replace(/\s+/g, '');
    if (!clean) return 'No text';
    return clean.length > 1 && clean === reverse(clean);
  }

  function operationsFor(text, prefix, suffix) {
    const rows = [
      ['Reversed', reverse(text)],
      ['Is palindrome', palindromeAnswer(text)],
      ['Uppercase', text.toUpperCase()],
      ['Lowercase', text.toLowerCase()],
      ['First 3 chars', text.slice(0, 3)],
      ['Last 3 chars', text.slice(-3)],
      ['Unique chars', new Set(text).size]
    ];
    if (prefix) rows.push([`Starts with "${prefix}"`, text.startsWith(prefix)]);
    if (suffix) rows.push([`Ends with "${suffix}"`, text.endsWith(suffix)]);
    return rows;
  }

  function analyzeText() {
    const a = textInputs.a.value;
    const b = textInputs.b.value;
    const prefix = textInputs.prefix.value;
    const suffix = textInputs.suffix.value;

    if (!a && !b) {
      textInputs.combined.style.display = 'none';
      textInputs.results.style.display = 'none';
      return;
    }

    const combined = [
      ['Text A', a],
      ['Text B', b],
      ['Concatenation (A + B)', a + b],
      ['Length A / B', `${a.length} / ${b.length}`]
    ];

    textInputs.combined.style.display = 'block';
    textInputs.results.style.display = 'grid';
    textInputs.combined.innerHTML = table(combined);
    textInputs.outputA.innerHTML = table(operationsFor(a, prefix, suffix));
    textInputs.outputB.innerHTML = table(operationsFor(b, prefix, suffix));
  }

  textInputs.analyze.addEventListener('click', analyzeText);
  [textInputs.a, textInputs.b, textInputs.prefix, textInputs.suffix].forEach((input) =>
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') analyzeText(); }));
}
