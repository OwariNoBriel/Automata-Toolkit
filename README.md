# Automata Toolkit

A modular web app for learning binary trees, string operations, sets, and regular operations. The project has been refactored into a cleaner tab-based layout with separate UI sections and independent per-tab logic, while keeping the core toolkit operations accessible from a single Flask app.

## What was implemented

### Modern UI refactor
- Reworked the app into a collapsible sidebar with separate pages for:
  - Binary Tree
  - Text Operations
  - Sets
  - Regular Operations
- Split the interface into reusable template sections in `templates/toolkit/`
- Split JavaScript behavior by tab into independent files in `static/`
- Kept the shared app shell and styling in `static/app.js` and `static/style.css`
- Preserved the sidebar navigation and broad app layout while separating each tool into its own page state

### Independent tab logic
- Each tool section now has its own independent inputs and handlers
- The tree tab no longer depends on shared form state
- The Regular Operations tab has its own input, script, and API route
- This prevents cross-tab collisions and keeps each module easier to maintain

### Regular Operations
- Type an expression such as `A+BC` and see the strings it produces (`ABC`, `AABC`, `AAABC`, ...)
- Supports Kleene star `*`, Kleene plus `+`, alternation `|`, parentheses `( )`, and concatenation
- Results are grouped by length, with a max-length slider because `*` and `+` repeat forever
- Shows how the operators were grouped, and explains malformed expressions in plain language

### Styling update
- Dark UI theme with readable contrast
- Sidebar, cards, inputs, buttons, and output panels aligned for a consistent interface

## Project structure

- `app.py` – Flask entry point and `/api/expression` and `/api/regex` routes
- `traversal_toolkit/` – toolkit logic
  - `tree.py` – binary tree building and traversal logic
  - `text_ops.py` – string operations
  - `string_extra.py` – extra string utilities
  - `set_ops.py` – set operations
  - `regex_ops.py` – regular expression parsing and string generation
- `templates/`
  - `index.html` – shell layout
  - `sidebar.html` – sidebar navigation
  - `toolkit/` – individual page templates for each tool
- `static/`
  - `app.js` – page switching and shared shell behavior
  - `tree.js` – expression tree tab logic
  - `text.js` – text tab logic
  - `set.js` – set tab logic
  - `regex.js` – Regular Operations tab logic
  - `style.css` – dark responsive styling
- `tests/test_core.py` – project tests and regression checks

## Features

### Binary Tree
- Type an arithmetic expression such as `A+B/D-E`
- See its expression tree drawn three times, with preorder, inorder and postorder visit numbers
- Read the prefix, infix and postfix forms of the expression

### Text Operations
- Input strings and run multiple text transformations
- Reverse, length, case conversion, palindrome checks, prefix/suffix logic
- Combine operations and inspect output clearly

### Sets
- Work with custom sets or generated values
- Perform union, intersection, difference, and symmetric difference
- See Cartesian products (A × B, B × A) and power sets
- View cardinality

### Regular Operations
- Enter an expression with `*`, `+`, `|`, `( )` and concatenation
- See the strings it generates, shortest first, up to a chosen length

## Run

```bash
cd /path/to/Traversal-Toolkit
./flask/bin/python app.py
```

Or with a normal virtual environment:

```bash
python3 -m venv flask
./flask/bin/pip install -r requirements.txt
./flask/bin/python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Expression syntax

| Write | Meaning | Example | Produces |
|---|---|---|---|
| `AB` | concatenation | `AB` | AB |
| `A*` | zero or more | `A*B` | B, AB, AAB, ... |
| `A+` | one or more | `A+BC` | ABC, AABC, AAABC, ... |
| `A\|B` | either one | `A\|BC` | A, BC |
| `( )` | grouping | `(AB)+` | AB, ABAB, ... |

Every character other than `| * + ( )` is a literal symbol. Use a backslash to match an operator literally, e.g. `\+`.

## Tests

```bash
./flask/bin/python -m pytest -q
```

## Notes

The app has been restructured to support cleaner modular development while preserving the original educational toolkit behavior. The sidebar, tab separation, and dark styling are the main UI improvements, while the core toolkit logic remains focused on the original traversal and automata concepts.

