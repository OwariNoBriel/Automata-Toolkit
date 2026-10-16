// Regular Operations tab. Python parses the expression and generates the strings; this file only shows them.
const regexSection = document.getElementById('page-regex'); // the whole Regular Operations page
if (regexSection) { // only run when this page exists in the HTML
  const esc = (value) => String(value) // makes text safe to put inside HTML
    .replace(/&/g, '&amp;') // & becomes &amp;
    .replace(/</g, '&lt;') // < becomes &lt;
    .replace(/>/g, '&gt;') // > becomes &gt;
    .replace(/"/g, '&quot;'); // " becomes &quot;

  const regexInputs = { // the page elements we talk to
    expr: document.getElementById('regex-input'), // the expression box
    max: document.getElementById('regex-max'), // the iterations slider
    maxValue: document.getElementById('regex-max-value'), // the number shown beside the slider
    chips: document.getElementById('regex-chips'), // where the example buttons go
    output: document.getElementById('regex-output') // where results appear
  };

  const EXAMPLES = ['A+B', 'A+BC', 'A*B', '(AB)+', 'A|BC', '(A|B)*C+', '(A|B)+C+', '(AB|C)+D', 'A(B|C)*']; // one button per example
  let timer = null; // used to wait a moment after typing stops
  let latest = 0; // the number of the newest request, so old answers can be ignored

  function renderRegex(data) { // build the results card from Python's answer
    let rows = ''; // the HTML for all paths
    data.paths.forEach((path, index) => { // one row per path
      rows += `<div class="regex-group"><b>path ${index + 1}<small>${esc(path.path)}</small></b><div class="regex-words">`; // start the row with the path's shape
      for (const word of path.words) { // every string of this path, in iteration order
        rows += `<span>${word === '' ? 'ε' : esc(word)}</span>`; // ε stands for the empty string
      }
      rows += '</div></div>'; // end the row
    });
    let anyEmpty = false; // does any path give the empty string?
    for (const path of data.paths) { // check every path
      if (path.words.includes('')) anyEmpty = true; // found one
    }
    const plural = data.count === 1 ? '' : 's'; // "1 string" but "4 strings"
    const pathPlural = data.paths.length === 1 ? '' : 's'; // "1 path" but "2 paths"
    const empty = anyEmpty ? ' (ε = the empty string)' : ''; // explain ε when it appears
    let html = `<p class="regex-read">${esc(data.read)}</p>`; // how the operators were grouped
    html += `<p class="regex-meta">${data.count}${data.capped ? '+' : ''} string${plural} over ${data.paths.length} path${pathPlural}, up to ${data.iterations} iteration${data.iterations === 1 ? '' : 's'}${empty}</p>`; // the summary
    return html + rows; // the summary followed by the rows
  }

  async function analyzeRegex() { // send the expression to Python and show the result
    const mine = ++latest; // number this request
    regexInputs.maxValue.textContent = regexInputs.max.value; // show the slider's value
    if (!regexInputs.expr.value.trim()) { // nothing typed
      regexInputs.output.innerHTML = '<p class="hint">Type an expression to begin.</p>'; // show a hint
      return; // nothing more to do
    }
    const response = await fetch('/api/regex', { // ask the server
      method: 'POST', // we are sending data
      headers: { 'Content-Type': 'application/json' }, // the data is JSON
      body: JSON.stringify({ regex: regexInputs.expr.value, iterations: Number(regexInputs.max.value) }) // expression and iteration count
    });
    const data = await response.json(); // read the answer
    if (mine !== latest) return; // a newer request exists, so drop this old answer
    if (!response.ok || data.error) { // the expression was malformed
      regexInputs.output.innerHTML = `<p class="regex-error">${esc(data.error || 'Something went wrong.')}</p>`; // show why
    } else { // all good
      regexInputs.output.innerHTML = renderRegex(data); // show the strings
    }
  }

  function scheduleRegex() { // wait a moment after typing stops before asking the server
    clearTimeout(timer); // cancel the previous wait
    timer = setTimeout(analyzeRegex, 150); // ask again after 150 milliseconds
  }

  for (const example of EXAMPLES) { // make one button per example
    const chip = document.createElement('button'); // a new button
    chip.type = 'button'; // it does not submit anything
    chip.textContent = example; // the example is its label
    chip.addEventListener('click', () => { // when the button is clicked
      regexInputs.expr.value = example; // put the example into the box
      analyzeRegex(); // and show its strings
    });
    regexInputs.chips.appendChild(chip); // add the button to the page
  }
  regexInputs.expr.addEventListener('input', scheduleRegex); // re-run when the expression changes
  regexInputs.max.addEventListener('input', scheduleRegex); // re-run when the slider moves
  analyzeRegex(); // show the first result straight away
}
