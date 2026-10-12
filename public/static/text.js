const textSection = document.getElementById('page-text');
if (textSection) {
  const esc = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function show(answer) {
    if (answer === true) return 'Yes';
    if (answer === false) return 'No';
    return answer;
  }

  function table(rows) {
    let html = '<table>';
    for (const [label, answer] of rows) {
      html += `<tr><th>${esc(label)}</th><td>${esc(show(answer))}</td></tr>`;
    }
    return html + '</table>';
  }

  const textInputs = {
    a: document.getElementById('text-input-a'),
    b: document.getElementById('text-input-b'),
    analyze: document.getElementById('text-analyze'),
    combined: document.getElementById('text-output-combined'),
    results: document.getElementById('text-results-grid') || document.getElementById('results-grid'),
    outputA: document.getElementById('text-output-a'),
    outputB: document.getElementById('text-output-b')
  };

  async function analyzeText() {
    const a = textInputs.a ? textInputs.a.value : '';
    const b = textInputs.b ? textInputs.b.value : '';
    if (!a && !b) {
      if (textInputs.combined) textInputs.combined.style.display = 'none';
      if (textInputs.results) textInputs.results.style.display = 'none';
      return;
    }
    const response = await fetch('/api/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a, b })
    });
    const data = await response.json();
    if (data.empty) {
      if (textInputs.combined) textInputs.combined.style.display = 'none';
      if (textInputs.results) textInputs.results.style.display = 'none';
      return;
    }
    if (textInputs.combined) {
      textInputs.combined.style.display = 'block';
      textInputs.combined.innerHTML = table(data.combined);
    }
    if (textInputs.results) {
      textInputs.results.style.display = 'grid';
    }
    if (textInputs.outputA) textInputs.outputA.innerHTML = table(data.a);
    if (textInputs.outputB) textInputs.outputB.innerHTML = table(data.b);
  }

  if (textInputs.analyze) textInputs.analyze.addEventListener('click', analyzeText);
  [textInputs.a, textInputs.b].forEach((input) => {
    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') analyzeText();
      });
    }
  });
}
