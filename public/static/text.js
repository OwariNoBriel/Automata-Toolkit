const textSection = document.getElementById('page-text');            // grab the Text Operations page (<section id="page-text">)
if (textSection) {                                                    // only run this code if that page exists in the HTML
  const esc = (value) => String(value)                                // function that makes text safe to put inside HTML
    .replace(/&/g, '&amp;')                                           // & becomes &amp; (must be done first)
    .replace(/</g, '&lt;')                                            // < becomes &lt; so it isn't read as a tag
    .replace(/>/g, '&gt;')                                            // > becomes &gt;
    .replace(/"/g, '&quot;');                                         // " becomes &quot;

  function show(answer) {                                             // turns true/false into friendly words
    if (answer === true) return 'Yes';                                // true -> "Yes"
    if (answer === false) return 'No';                                // false -> "No"
    return answer;                                                    // anything else is shown as it is
  }

  function table(rows) {                                              // builds an HTML table from [label, answer] pairs
    let html = '<table>';                                             // start the table
    for (const [label, answer] of rows) {                             // loop over each pair, splitting it into label and answer
      html += `<tr><th>${esc(label)}</th><td>${esc(show(answer))}</td></tr>`; // add one row: label on the left, answer on the right
    }
    return html + '</table>';                                         // close the table and send it back
  }

  const textInputs = {                                                // one object holding every element this page uses
    a: document.getElementById('text-input-a'),                       // input box for Text A
    b: document.getElementById('text-input-b'),                       // input box for Text B
    analyze: document.getElementById('text-analyze'),                 // the Analyze button
    combined: document.getElementById('text-output-combined'),        // box for results that use both texts (A + B)
    results: document.getElementById('text-results-grid') || document.getElementById('results-grid'), // the two-column grid; tries the first id, falls back to the second
    outputA: document.getElementById('text-output-a'),                // where Text A's results go
    outputB: document.getElementById('text-output-b')                 // where Text B's results go
  };

  async function analyzeText() {                                      // runs when the user clicks Analyze or presses Enter (async = it waits for the server)
    const a = textInputs.a ? textInputs.a.value : '';                 // read Text A, or '' if the box doesn't exist
    const b = textInputs.b ? textInputs.b.value : '';                 // read Text B, or '' if the box doesn't exist
    if (!a && !b) {                                                   // if both boxes are empty...
      if (textInputs.combined) textInputs.combined.style.display = 'none'; // ...hide the combined results
      if (textInputs.results) textInputs.results.style.display = 'none';   // ...hide the A/B grid
      return;                                                         // ...and stop, nothing to analyze
    }
    const response = await fetch('/api/text', {                       // send the texts to the Flask route /api/text and wait for the reply
      method: 'POST',                                                 // POST = we are sending data
      headers: { 'Content-Type': 'application/json' },                // tell the server the data is JSON
      body: JSON.stringify({ a, b })                                  // turn {a, b} into a JSON string to send
    });
    const data = await response.json();                               // read the server's reply as JSON
    if (data.empty) {                                                 // the server says there was nothing to analyze
      if (textInputs.combined) textInputs.combined.style.display = 'none'; // hide the combined results
      if (textInputs.results) textInputs.results.style.display = 'none';   // hide the A/B grid
      return;                                                         // stop here
    }
    if (textInputs.combined) {                                        // if the combined box exists...
      textInputs.combined.style.display = 'block';                    // ...make it visible
      textInputs.combined.innerHTML = table(data.combined);           // ...and fill it with the combined results table
    }
    if (textInputs.results) {                                         // if the A/B grid exists...
      textInputs.results.style.display = 'grid';                      // ...show it as a grid (two columns)
    }
    if (textInputs.outputA) textInputs.outputA.innerHTML = table(data.a); // fill the Text A column with its results table
    if (textInputs.outputB) textInputs.outputB.innerHTML = table(data.b); // fill the Text B column with its results table
  }

  if (textInputs.analyze) textInputs.analyze.addEventListener('click', analyzeText); // clicking Analyze runs analyzeText
  [textInputs.a, textInputs.b].forEach((input) => {                   // do the next part for both input boxes
    if (input) {                                                      // skip it if the box doesn't exist
      input.addEventListener('keydown', (event) => {                  // listen for any key pressed inside the box
        if (event.key === 'Enter') analyzeText();                     // pressing Enter also runs analyzeText
      });
    }
  });
}