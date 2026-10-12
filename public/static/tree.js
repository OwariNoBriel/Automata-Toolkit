// Binary Tree tab. Python builds the tree and numbers the traversals; this file only sends the text and draws it.
const treeSection = document.getElementById('page-tree'); // the whole Binary Tree page
if (treeSection) { // only run when this page exists in the HTML
  const esc = (value) => String(value) // makes text safe to put inside HTML
    .replace(/&/g, '&amp;') // & becomes &amp;
    .replace(/</g, '&lt;') // < becomes &lt;
    .replace(/>/g, '&gt;') // > becomes &gt;
    .replace(/"/g, '&quot;'); // " becomes &quot;

  const treeInputs = { // the page elements we talk to
    expr: document.getElementById('tree-expr'), // the expression box
    go: document.getElementById('tree-go'), // the Build tree button
    error: document.getElementById('tree-error'), // where error messages appear
    output: document.getElementById('tree-output') // where the drawings appear
  };

  function isOperator(value) { // is this node an operator (so we can colour it differently)?
    return value.length === 1 && '+-*/^'.includes(value); // one character that is one of + - * / ^
  }

  function drawTree(root, key) { // draw one tree; key says which visit number to show (pre, ino or post)
    const nodes = []; // every node of the tree
    const edges = []; // every parent-child pair, drawn as a line

    function place(node, depth, parent) { // work out where one node sits, then do its children
      if (!node) return; // an empty spot has nothing to draw
      node.px = 36 + node.x * 52; // sideways position comes from the inorder slot Python gave the node
      node.py = 32 + depth * 64; // downward position comes from how deep the node is
      nodes.push(node); // remember the node
      if (parent) edges.push([parent, node]); // remember the line up to its parent
      place(node.l, depth + 1, node); // place the left child one level lower
      place(node.r, depth + 1, node); // place the right child one level lower
    }
    place(root, 0, null); // start at the root, which has no parent

    let maxX = 0; // the right-most slot used
    let maxY = 0; // the lowest position used
    for (const node of nodes) { // look at every node
      if (node.x > maxX) maxX = node.x; // remember the largest slot
      if (node.py > maxY) maxY = node.py; // remember the largest depth position
    }
    const width = 72 + maxX * 52; // drawing width that fits every node
    const height = maxY + 40; // drawing height that fits every node

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#fff">`; // open the drawing
    for (const [a, b] of edges) { // draw the lines first so circles sit on top
      svg += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="#9fb1bb" stroke-width="2"/>`; // one line per edge
    }
    for (const node of nodes) { // then draw each node
      const fill = isOperator(node.v) ? '#fde8c8' : '#e3f3f4'; // operators orange, operands blue
      svg += `<circle cx="${node.px}" cy="${node.py}" r="18" fill="${fill}" stroke="#0e7c86" stroke-width="2"/>`; // the circle
      svg += `<text x="${node.px}" y="${node.py + 5}" text-anchor="middle" font-size="14" fill="#14262f">${esc(node.v)}</text>`; // its value
      svg += `<circle cx="${node.px + 14}" cy="${node.py - 14}" r="9" fill="#0e7c86"/>`; // the small badge circle
      svg += `<text x="${node.px + 14}" y="${node.py - 10}" text-anchor="middle" font-size="11" fill="#fff">${node[key]}</text>`; // the visit number
    }
    return svg + '</svg>'; // close the drawing and hand it back
  }

  async function buildTree() { // send the expression to Python and show the result
    const response = await fetch('/api/expression', { // ask the server
      method: 'POST', // we are sending data
      headers: { 'Content-Type': 'application/json' }, // the data is JSON
      body: JSON.stringify({ expr: treeInputs.expr.value }) // the typed expression
    });
    const data = await response.json(); // read the answer
    treeInputs.error.textContent = data.error || ''; // show an error message, or clear the old one
    if (data.error) return; // nothing to draw when the expression is malformed

    const views = [ // the three traversals to show
      ['Preorder (prefix)', 'Root → Left → Right', 'pre', data.prefix], // title, rule, number key, text
      ['Inorder (infix)', 'Left → Root → Right', 'ino', data.infix], // inorder uses the "ino" numbers
      ['Postorder (postfix)', 'Left → Right → Root', 'post', data.postfix] // postorder uses the "post" numbers
    ];
    let html = ''; // the page content we are building
    for (const [name, rule, key, text] of views) { // one section per traversal
      html += `<h3>${name} <small>${rule}</small></h3>`; // heading with its rule
      html += `<div class="tree">${drawTree(data.tree, key)}</div>`; // the drawn tree
      html += `<p class="seq">${esc(text)}</p>`; // the traversal written out
    }
    treeInputs.output.innerHTML = html; // put it on the page
  }

  treeInputs.go.addEventListener('click', buildTree); // build when the button is clicked
  treeInputs.expr.addEventListener('keydown', (event) => { // also when a key is pressed in the box
    if (event.key === 'Enter') buildTree(); // but only the Enter key
  });
}
