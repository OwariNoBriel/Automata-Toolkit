// Binary Tree tab: type an expression in prefix, infix OR postfix and the other two fill in.
const treeSection = document.getElementById('page-tree'); // the whole Binary Tree page
if (treeSection) { // only run when this page exists in the HTML
  const style = document.createElement('style'); // small bit of CSS just for this page
  style.textContent = `#page-tree .tree-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 8px}
  #page-tree .tree-head h3{margin:0}#page-tree .tree-head small{font-weight:400;opacity:.7;margin-left:8px}
  #page-tree .tree-entry{display:flex;gap:8px;flex:1;min-width:260px;max-width:520px}#page-tree .tree-entry input{flex:1;min-width:0}
  #page-tree .tree{overflow-x:auto;border-radius:8px}#tree-error{color:#e5534b;min-height:1.2em;margin:6px 0 0}`;
  document.head.append(style);
 
  const esc = (value) => String(value) // makes text safe to put inside HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
 
  const treeError = document.getElementById('tree-error'); // where error messages appear
  const kinds = { // one entry per box: its input, its drawing area, and which visit order it shows
    prefix:  { input: document.getElementById('in-prefix'),  draw: document.getElementById('draw-prefix'),  order: 'pre' },
    infix:   { input: document.getElementById('in-infix'),   draw: document.getElementById('draw-infix'),   order: 'in' },
    postfix: { input: document.getElementById('in-postfix'), draw: document.getElementById('draw-postfix'), order: 'post' },
  };
 
  const OPERATORS = '+-*/^'; // the operators we understand
  const isOperator = (value) => value.length === 1 && OPERATORS.includes(value); // is this symbol an operator?
 
  function operand(token) { // checks that a symbol is a valid operand (letters, numbers, _ or .)
    if (!/^[A-Za-z0-9_.]+$/.test(token)) throw new Error(`"${token}" is not a valid operand or operator.`);
    return token;
  }
 
  function symbols(text) { // split the typed text into symbols
    const parts = text.trim().split(/\s+/).filter(Boolean); // split on spaces
    return parts.length === 1 && parts[0].length > 1 ? [...parts[0]] : parts; // no spaces at all: one character per symbol
  }
 
  function prefixToInfix(tokens) { // prefix -> fully bracketed infix, e.g. - + A B C -> ((A+B)-C)
    let pos = 0; // how many symbols we have used so far
    function read() { // read one whole sub-expression
      if (pos >= tokens.length) throw new Error('The prefix expression is incomplete.');
      const token = tokens[pos++]; // take the next symbol
      if (isOperator(token)) { const left = read(); const right = read(); return '(' + left + token + right + ')'; } // operator: read its two sides
      return operand(token); // otherwise it is a single operand
    }
    const result = read(); // read the whole expression
    if (pos < tokens.length) throw new Error('The prefix expression has extra symbols at the end.');
    return result;
  }
 
  function postfixToInfix(tokens) { // postfix -> fully bracketed infix, e.g. A B + C - -> ((A+B)-C)
    const stack = []; // finished sub-expressions waiting for an operator
    for (const token of tokens) {
      if (isOperator(token)) { // operator: join the last two sub-expressions
        if (stack.length < 2) throw new Error('The postfix expression is missing an operand.');
        const right = stack.pop(); const left = stack.pop();
        stack.push('(' + left + token + right + ')');
      } else {
        stack.push(operand(token)); // operand: put it on the stack
      }
    }
    if (stack.length !== 1) throw new Error('The postfix expression is missing an operator.');
    return stack[0];
  }
 
  function toInfix(kind, text) { // whatever was typed -> infix text the server understands
    if (!text.trim()) throw new Error('Type an expression first.');
    if (kind === 'infix') return text; // already infix
    const tokens = symbols(text);
    return kind === 'prefix' ? prefixToInfix(tokens) : postfixToInfix(tokens);
  }
 
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
 
  async function build(kind) { // runs when you press Build or Enter in the box called `kind`
    treeError.textContent = ''; // clear the old error
    try {
      const expr = toInfix(kind, kinds[kind].input.value); // convert what was typed to infix
      const response = await fetch('/api/expression', { // ask the server to build the tree
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expr })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'That expression is not valid.');
      for (const [name, info] of Object.entries(kinds)) { // update all three sections
        if (name !== kind) info.input.value = data[name]; // fill the OTHER two boxes (keep what you typed)
        info.draw.innerHTML = drawTree(data.tree, info.order); // redraw the tree with this order's numbers
      }
    } catch (error) {
      treeError.textContent = error.message; // show the problem
    }
  }
 
  for (const [name, info] of Object.entries(kinds)) { // wire up each box
    info.input.addEventListener('keydown', (event) => { if (event.key === 'Enter') build(name); }); // Enter builds
  }
  document.querySelectorAll('[data-build]').forEach((button) => { // wire up each Build button
    button.addEventListener('click', () => build(button.dataset.build));
  });
 
  kinds.infix.input.value = 'A+B/D-E'; // starting example
  build('infix');
}
 