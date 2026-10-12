const treeSection = document.getElementById('page-tree');
if (treeSection) {
  const esc = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\\': '&#92;' }[char]));

  const treeInputs = {
    expr: document.getElementById('tree-expr'),
    go: document.getElementById('tree-go'),
    error: document.getElementById('tree-error'),
    output: document.getElementById('tree-output')
  };

  const walk = {
    pre: (node) => node ? [node, ...walk.pre(node.l), ...walk.pre(node.r)] : [],
    in: (node) => node ? [...walk.in(node.l), node, ...walk.in(node.r)] : [],
    post: (node) => node ? [...walk.post(node.l), ...walk.post(node.r), node] : []
  };
  const isOperator = (value) => value.length === 1 && '+-*/^'.includes(value);

  // Draws one tree. Each node gets a small badge with its visit number for this traversal.
  function drawTree(root, order) {
    const nodes = [];
    const edges = [];

    (function go(node, depth, parent) {
      if (!node) return;
      node.px = 36 + node.x * 52;
      node.py = 32 + depth * 64;
      nodes.push(node);
      if (parent) edges.push([parent, node]);
      go(node.l, depth + 1, node);
      go(node.r, depth + 1, node);
    })(root, 0, null);

    const width = 72 + Math.max(...nodes.map((node) => node.x)) * 52;
    const height = Math.max(...nodes.map((node) => node.py)) + 40;

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#fff">` +
      edges.map(([a, b]) => `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="#9fb1bb" stroke-width="2"/>`).join('') +
      nodes.map((node) => `<circle cx="${node.px}" cy="${node.py}" r="18" fill="${isOperator(node.v) ? '#fde8c8' : '#e3f3f4'}" stroke="#0e7c86" stroke-width="2"/>` +
        `<text x="${node.px}" y="${node.py + 5}" text-anchor="middle" font-size="14" fill="#14262f">${esc(node.v)}</text>` +
        `<circle cx="${node.px + 14}" cy="${node.py - 14}" r="9" fill="#0e7c86"/>` +
        `<text x="${node.px + 14}" y="${node.py - 10}" text-anchor="middle" font-size="11" fill="#fff">${order.indexOf(node) + 1}</text>`).join('') +
      '</svg>';
  }

  async function buildTree() {
    const response = await fetch('/api/expression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expr: treeInputs.expr.value })
    });
    const data = await response.json();
    treeInputs.error.textContent = data.error || '';
    if (data.error) return;

    treeInputs.output.innerHTML = [
      ['Preorder (prefix)', 'Root → Left → Right', 'pre', data.prefix],
      ['Inorder (infix)', 'Left → Root → Right', 'in', data.infix],
      ['Postorder (postfix)', 'Left → Right → Root', 'post', data.postfix]
    ].map(([name, rule, key, text]) =>
      `<h3>${name} <small>${rule}</small></h3><div class="tree">${drawTree(data.tree, walk[key](data.tree))}</div>` +
      `<p class="seq">${esc(text)}</p>`).join('');
  }

  treeInputs.go.addEventListener('click', buildTree);
  treeInputs.expr.addEventListener('keydown', (event) => { if (event.key === 'Enter') buildTree(); });
}
