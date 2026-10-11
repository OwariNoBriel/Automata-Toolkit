# Developer Guide: Adding a New Sidebar Tab

This project is organized so each feature tab has its own UI, its own frontend logic, and its own backend API handling. The main goal is separation of concerns: the sidebar shell stays shared, while each tool lives in its own files and does not depend on other tabs.

## Project layout

### Shared app shell
- `app.py`  
  Flask app entry point. Handles route rendering and the `/api/expression` and `/api/regex` endpoints.

- `templates/index.html`  
  Main page shell. This is the top-level layout that includes the sidebar and the tab sections.

- `templates/sidebar.html`  
  The sidebar navigation items. This is where new tab names are defined.

- `static/app.js`  
  Shared page behavior such as sidebar toggle and tab switching. It does not contain per-tool logic.

- `static/style.css`  
  Shared styling for the overall app theme, layout, sidebar, cards, buttons, inputs, and common classes.

### Tool-specific files
- `templates/toolkit/`  
  One file per tab, for example:
  - `tree.html`
  - `text.html`
  - `set.html`
  - `regex.html`

- `static/tree.js`  
  Logic for the tree tab only.

- `static/text.js`  
  Logic for the text operations tab only.

- `static/set.js`  
  Logic for the set operations tab only.

- `static/regex.js`  
  Logic for the Regular Operations tab only.

- `traversal_toolkit/`  
  Python business logic for the toolkit modules.
  - `tree.py`
  - `text_ops.py`
  - `string_extra.py`
  - `set_ops.py`
  - `regex_ops.py`

---

## How a tab works

Each tab follows this pattern:

1. Add a sidebar button in `templates/sidebar.html`
2. Add a matching section in the main page layout (usually in `templates/index.html` or a shared tab block)
3. Create a tab-specific HTML file under `templates/toolkit/`
4. Add a tab-specific JavaScript file in `static/`
5. Add the backend logic in the matching Python module inside `traversal_toolkit/`
6. Connect the frontend JS to the Flask API route in `app.py`
7. Add the tab-specific CSS only if needed in `static/style.css`

---

## Example: adding a new tab called "Graph"

### 1) Add the sidebar item
In `templates/sidebar.html`, add a button similar to this:

```html
<button class="sidebar-item" data-page="graph">Graph</button>
```

The `data-page` value should match the tab identifier used later in the frontend logic.

### 2) Add the page section
In `templates/index.html`, include the new tab section, usually alongside the other pages:

```html
<section id="page-graph" class="page" data-page="graph">
  <div class="input">
    <label>Graph input
      <textarea id="graph-input"></textarea>
    </label>
    <button id="graph-run">Run Graph</button>
  </div>
  <div id="graph-output"></div>
</section>
```

Or, if you prefer a cleaner setup, you can create a dedicated file in `templates/toolkit/graph.html` and include it from `templates/index.html`.

### 3) Create the tab template file
Create a new file in `templates/toolkit/graph.html` with the UI markup for the tab. Keep it focused only on that feature.

Example:

```html
<section id="page-graph" class="page">
  <label>Graph input <textarea id="graph-input"></textarea></label>
  <div class="row">
    <button id="graph-run">Run Graph</button>
  </div>
  <div id="graph-output"></div>
</section>
```

### 4) Create the JavaScript file
Create `static/graph.js` and attach event listeners for the new controls.

Example:

```javascript
const graphSection = document.getElementById('page-graph');

if (graphSection) {
  const graphInputs = {
    input: document.getElementById('graph-input'),
    run: document.getElementById('graph-run'),
    output: document.getElementById('graph-output')
  };

  async function analyzeGraph() {
    const payload = {
      graph: graphInputs.input.value,
      graph_source: 'custom'
    };

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    graphInputs.output.innerHTML = `<pre>${data.graph.result}</pre>`;
  }

  graphInputs.run.addEventListener('click', analyzeGraph);
}
```

This file should only contain the UI behavior of that feature. It should not define core algorithm logic.

### 5) Add backend logic in Python
Create or update a module in `traversal_toolkit/`, such as `traversal_toolkit/graph.py`.

This is where the actual algorithm lives. For example:

```python
# traversal_toolkit/graph.py

def graph_ops(data):
    # compute graph metrics or adjacency results here
    return {"result": "graph output"}
```

Then in `app.py`, add a route or branch to call it.

Example:

```python
from traversal_toolkit import graph

@app.route('/api/analyze', methods=['POST'])
def analyze():
    payload = request.get_json()

    if payload.get('graph') is not None:
        result = graph.graph_ops(payload['graph'])
        return jsonify({"graph": result})
```

This is the clean separation that keeps Python logic in the toolkit folder and frontend logic in the static folder.

### 6) Add styles in `static/style.css`
If the new tab needs specific classes, add them to `static/style.css`.

Examples:

```css
#graph-output {
  margin-top: 12px;
}

#graph-output pre {
  background: var(--bg);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
}
```

Keep general app styles in the shared CSS file, and only add tab-specific styling when needed.

---

## What the JavaScript files in `static/` do

The files in `static/` are frontend handlers. They do not implement the actual algorithms. Their job is to:

- read the user input from the DOM
- validate it
- send JSON to the Flask API
- render the response back into the page

### Example: `static/regex.js`
`regex.js` does this:

- reads the expression and the max-length slider
- sends both to `/api/regex`
- receives the generated strings and how the expression was grouped
- writes the output into `#regex-output`

It is only responsible for the Regular Operations tab UI and request flow.

### Example: `static/tree.js`
`tree.js` does the same for tree operations:

- reads the expression input
- calls the Python expression-tree logic through `/api/expression`
- draws the preorder, inorder and postorder trees

This pattern is repeated for the text, set and regex tabs.

---

## What the Python files in `traversal_toolkit/` do

The files under `traversal_toolkit/` contain the actual algorithmic and data-processing logic. These are the Python modules that handle the computational work.

### `traversal_toolkit/tree.py`
- builds binary trees from traversals
- validates traversal consistency
- computes preorder, inorder, postorder, height, structure, etc.

### `traversal_toolkit/text_ops.py`
- handles basic text operations
- concatenation, reverse, counts, casing, comparisons, etc.

### `traversal_toolkit/string_extra.py`
- handles extra string-related utilities like prefix, suffix, reverse, palindrome checks

### `traversal_toolkit/set_ops.py`
- performs union, intersection, difference, symmetric difference, cardinality

### `traversal_toolkit/regex_ops.py`
- parses expressions with `*`, `+`, `|`, `( )` and concatenation
- generates the strings an expression produces, shortest first
- builds an NFA and tests whether a string matches

In short:
- `static/*.js` = browser-side UI + API calls
- `traversal_toolkit/*.py` = actual logic and computation
- `app.py` = bridge between them

---

## Good rules for adding new features

1. Keep each tab independent.
2. Do not share DOM IDs across tabs.
3. Do not mix UI logic and algorithm logic in the same file.
4. Put business logic in `traversal_toolkit/`.
5. Keep the page shell in `templates/` and shared styling in `static/style.css`.
6. Keep request/response flow in `app.py`.
7. Use clear names like `graph.js`, `graph.py`, and `graph.html` so the structure stays predictable.

---

## Quick checklist

When you add a new tab, check these boxes:

- [ ] Sidebar item added
- [ ] Tab section added to template
- [ ] New HTML file created if needed
- [ ] New JS file created in `static/`
- [ ] New Python module created in `traversal_toolkit/`
- [ ] Endpoint added in `app.py`
- [ ] Style added in `static/style.css` if needed
- [ ] Feature tested and verified

---

## Practical reminder

The project is intentionally structured so each tab behaves like its own mini-feature. The app shell is shared, but each tool owns its own input form, JavaScript behavior, and Python processing logic. This is the easiest pattern to extend without breaking other tools.
