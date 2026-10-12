// Text Operations tab. Python does every operation; this file only sends the texts and shows the answers.
const textSection = document.getElementById('page-text'); // the whole Text Operations page
if (textSection) { // only run when this page exists in the HTML
  const esc = (value) => String(value) // makes text safe to put inside HTML
    .replace(/&/g, '&amp;') // & becomes &amp;
    .replace(/</g, '&lt;') // < becomes &lt;
    .replace(/>/g, '&gt;') // > becomes &gt;
    .replace(/"/g, '&quot;'); // " becomes &quot;

  function show(answer) { // true/false answers are shown as Yes/No
    if (answer === true) return 'Yes'; // true becomes Yes
    if (answer === false) return 'No'; // false becomes No
    return answer; // everything else is shown as it is
  }

  function table(rows) { // turn [label, answer] rows into an HTML table
    let html = '<table>'; // start the table
    for (const [label, answer] of rows) { // one table row per pair
      html += `<tr><th>${esc(label)}</th><td>${esc(show(answer))}</td></tr>`; // a label cell and an answer cell
    }
    return html + '</table>'; // close the table
  }

  const textInputs = { // the page elements we talk to
    a: document.getElementById('text-input-a'), // Text A box
    b: document.getElementById('text-input-b'), // Text B box
    prefix: document.getElementById('text-prefix'), // custom prefix box
    suffix: document.getElementById('text-suffix'), // custom suffix box
    analyze: document.getElementById('text-analyze'), // the Analyze button
    combined: document.getElementById('text-output-combined'), // card for rows about both texts
    results: document.getElementById('text-results-grid'), // the two-column area
    outputA: document.getElementById('text-output-a'), // column for Text A
    outputB: document.getElementById('text-output-b') // column for Text B
  };

  async function analyzeText() { // send the texts to Python and show the result
    const response = await fetch('/api/text', { // ask the server
      method: 'POST', // we are sending data
      headers: { 'Content-Type': 'application/json' }, // the data is JSON
      body: JSON.stringify({ // the four typed values
        a: textInputs.a.value, // Text A
        b: textInputs.b.value, // Text B
        prefix: textInputs.prefix.value, // custom prefix
        suffix: textInputs.suffix.value // custom suffix
      })
    });
    const data = await response.json(); // read the answer

    if (data.empty) { // nothing was typed
      textInputs.combined.style.display = 'none'; // hide the combined card
      textInputs.results.style.display = 'none'; // hide the two columns
      return; // nothing more to show
    }

    textInputs.combined.style.display = 'block'; // show the combined card
    textInputs.results.style.display = 'grid'; // show the two columns
    textInputs.combined.innerHTML = table(data.combined); // rows about both texts
    textInputs.outputA.innerHTML = table(data.a); // rows for Text A
    textInputs.outputB.innerHTML = table(data.b); // rows for Text B
  }

  textInputs.analyze.addEventListener('click', analyzeText); // analyze when the button is clicked
  for (const input of [textInputs.a, textInputs.b, textInputs.prefix, textInputs.suffix]) { // every text box
    input.addEventListener('keydown', (event) => { // when a key is pressed in it
      if (event.key === 'Enter') analyzeText(); // the Enter key also analyzes
    });
  }
}
