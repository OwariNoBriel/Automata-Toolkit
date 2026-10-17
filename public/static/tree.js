// Binary Tree tab: type an infix expression, then switch the output between preorder, inorder and postorder.
const treeSection = document.getElementById('page-tree'); // the whole Binary Tree page
if (treeSection) { // only run when this page exists in the HTML
  const style = document.createElement('style'); // small bit of CSS just for this page
  style.textContent = `#page-tree .tree-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:14px 0}
  #page-tree .tree-label{font-weight:600}
  #page-tree .tree-entry{display:flex;gap:8px;flex:1;min-width:260px;max-width:520px}#page-tree .tree-entry input{flex:1;min-width:0}
  #page-tree .tree-switch{display:flex;gap:6px;flex-wrap:wrap}
  #page-tree .tree-switch button{background:#262635;color:var(--ink);border:1px solid var(--line)}
  #page-tree .tree-switch button:hover{border-color:var(--acc)}
  #page-tree .tree-switch button[aria-pressed="true"]{background:var(--acc);color:#fff;border-color:var(--acc)}
  #page-tree .tree-head{margin:18px 0 8px}#page-tree .tree-head h3{margin:0}
  #page-tree .tree-head small{font-weight:400;opacity:.7;margin-left:8px}
  #page-tree .tree-output{margin:8px 0;font-family:monospace;font-size:15px;min-height:1.2em}
  #page-tree .tree{overflow-x:auto;border-radius:8px}#tree-error{color:#e5534b;min-height:1.2em;margin:6px 0 0}`;
  document.head.append(style);

  const esc = (value) => String(value) // makes text safe to put inside HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const treeError = document.getElementById('tree-error'); // where error messages appear
  const input = document.getElementById('tree-input'); // the one expression box
  const output = document.getElementById('tree-output'); // the text of the chosen traversal
  const title = document.getElementById('tree-title'); // heading above the output
  const draw = document.getElementById('tree-draw'); // where the tree is drawn
  const switchButtons = document.querySelectorAll('[data-output]'); // the Preorder / Inorder / Postorder buttons

  const kinds = { // one entry per traversal: its name, how it is visited, and its rule
    prefix:  { order: 'pre',  name: 'Preorder',  alias: 'prefix',  rule: 'Root → Left → Right' },
    infix:   { order: 'in',   name: 'Inorder',   alias: 'infix',   rule: 'Left → Root → Right' },
    postfix: { order: 'post', name: 'Postorder', alias: 'postfix', rule: 'Left → Right → Root' },
  };

  let data = null; // the last answer from the server (null until a tree is built)
  let outputKind = 'postfix'; // which traversal is shown right now

  const OPERATORS = '+-*/^'; // the operators we understand
  const isOperator = (value) => value.length === 1 && OPERATORS.includes(value); // is this symbol an operator?

  const walk = { // visit order of the nodes
    pre:  (n) => n ? [n, ...walk.pre(n.l), ...walk.pre(n.r)] : [], // root, left, right
    in:   (n) => n ? [...walk.in(n.l), n, ...walk.in(n.r)] : [], // left, root, right
    post: (n) => n ? [...walk.post(n.l), ...walk.post(n.r), n] : [], // left, right, root
  };

  function drawTree(root, order) { // draw one tree; badges show the visit number for this order
    const slots = new Map(walk.in(root).map((n, i) => [n, i])); // sideways position = inorder position
    const visit = walk[order](root); // nodes in the order they are visited
    const depths = new Map(); const edges = []; // how deep each node is, and the parent-child lines
    (function place(node, depth) {
      depths.set(node, depth);
      for (const child of [node.l, node.r]) if (child) { edges.push([node, child]); place(child, depth + 1); }
    })(root, 0);
    const px = (n) => 36 + slots.get(n) * 52; // x position of a node
    const py = (n) => 32 + depths.get(n) * 64; // y position of a node
    const width = 72 + (slots.size - 1) * 52, height = Math.max(...depths.values()) * 64 + 72;
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#fff">` +
      edges.map(([a, b]) => `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" stroke="#9fb1bb" stroke-width="2"/>`).join('') +
      [...slots.keys()].map((n) => `<circle cx="${px(n)}" cy="${py(n)}" r="18" fill="${isOperator(n.v) ? '#fde8c8' : '#e3f3f4'}" stroke="#0e7c86" stroke-width="2"/>` +
        `<text x="${px(n)}" y="${py(n) + 5}" text-anchor="middle" font-size="14" fill="#14262f">${esc(n.v)}</text>` +
        `<circle cx="${px(n) + 14}" cy="${py(n) - 14}" r="9" fill="#0e7c86"/>` +
        `<text x="${px(n) + 14}" y="${py(n) - 10}" text-anchor="middle" font-size="11" fill="#fff">${visit.indexOf(n) + 1}</text>`).join('') + '</svg>';
  }

  function render() { // show the chosen traversal: heading, output text, numbered tree and which button is pressed
    const info = kinds[outputKind];
    title.innerHTML = `${esc(info.name)} (${esc(info.alias)}) <small>${esc(info.rule)}</small>`; // heading changes with the choice
    switchButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.output === outputKind)));
    if (!data) { output.textContent = ''; draw.innerHTML = ''; return; } // nothing built yet
    output.textContent = info.name + ' output: ' + data[outputKind]; // the traversal written out
    draw.innerHTML = drawTree(data.tree, info.order); // numbers on the tree follow the chosen order
  }

  async function build() { // runs when you press Build or Enter in the box
    treeError.textContent = ''; // clear the old error
    if (!input.value.trim()) { resetAll(); return; } // empty box: reset everything
    try {
      const expr = input.value; // what was typed is infix already
      const response = await fetch('/api/expression', { // ask the server to build the tree
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expr })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'That expression is not valid.');
      data = result; // keep the answer so switching the output needs no new request
      render();
    } catch (error) {
      treeError.textContent = error.message; // show the problem
    }
  }

  switchButtons.forEach((button) => { // switching the OUTPUT traversal: no rebuild needed
    button.addEventListener('click', () => { outputKind = button.dataset.output; render(); });
  });

  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') build(); }); // Enter builds
  document.getElementById('tree-build').addEventListener('click', build); // Build button

  function resetAll() { // clear the box, output, tree and any error
    treeError.textContent = '';
    data = null; input.value = '';
    render();
    input.focus(); // ready for a new expression
  }

  const resetButton = document.createElement('button'); // the Reset button
  resetButton.type = 'button';
  resetButton.textContent = 'Reset';
  resetButton.className = document.getElementById('tree-build').className; // copy the Build button's look
  resetButton.addEventListener('click', resetAll);

  const resetBar = document.createElement('div'); // puts the button at the bottom centre
  resetBar.style.cssText = 'display:flex;justify-content:center;margin:24px 0';
  resetBar.append(resetButton);
  treeSection.append(resetBar);

  render(); // start with the Postorder button selected
}
