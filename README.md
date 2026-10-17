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
- Split JavaScript behavior by tab into independent files in `public/static/`
- Kept the shared app shell and styling in `public/static/app.js` and `public/static/style.css`
- Preserved the sidebar navigation and broad app layout while separating each tool into its own page state

### Independent tab logic
- Each tool section now has its own independent inputs and handlers
- The tree tab no longer depends on shared form state
- The Regular Operations tab has its own input, script, and API route
- This prevents cross-tab collisions and keeps each module easier to maintain

### Regular Operations
- Type an expression such as `A+BC` and see the strings it produces (`ABC`, `AABC`, `AAABC`, ...)
- Supports Kleene star `*`, Kleene plus `+`, alternation `|`, parentheses `( )`, and concatenation
- Results are derived depth-first along one path at a time, with an iterations slider because `*` and `+` repeat forever (iteration j repeats `+` j times and `*` j-1 times; each `|` choice is its own path)
- Shows how the operators were grouped, and explains malformed expressions in plain language

### Styling update
- Dark UI theme with readable contrast
- Sidebar, cards, inputs, buttons, and output panels aligned for a consistent interface

## Project structure

- `app.py` – Flask entry point and `/api/expression`, `/api/text`, `/api/sets` and `/api/regex` routes
- `traversal_toolkit/` – toolkit logic
  - `basics.py` – tiny hand-written helpers (length, contains, join, merge sort)
  - `expr_tree.py` – expression tokenizing, shunting-yard, tree building and traversals
  - `text_ops.py` – text operations, done character by character
  - `set_ops.py` – set operations, power set and Cartesian product, done with plain lists and loops
  - `regex_ops.py` – regular expression parsing and string generation
- `templates/`
  - `index.html` – shell layout
  - `sidebar.html` – sidebar navigation
  - `toolkit/` – individual page templates for each tool
- `public/static/`
  - `app.js` – page switching and shared shell behavior
  - `tree.js` – expression tree tab logic
  - `text.js` – text tab logic
  - `set.js` – set tab logic
  - `regex.js` – Regular Operations tab logic
  - `style.css` – dark responsive styling
- `tests/test_core.py` – project tests and regression checks

## Deploying to Vercel

Vercel detects the Flask app automatically (`app.py` exposes `app`), so no `vercel.json` is needed.

- Static files live in `public/static/` because Vercel serves `public/**` from its CDN and ignores Flask's own static folder. Flask serves the same folder when running locally.
- `requirements.txt` lists only what the deployed app needs. Install test tools locally with `py -m pip install -r requirements-dev.txt`.
- Push to GitHub, then in Vercel choose **Add New Project**, import the repo and press **Deploy**. Leave the build settings empty.

## Hand-written logic

The lesson code in `traversal_toolkit/` avoids built-in shortcuts on purpose, so every algorithm can be explained line by line:
no `set` operators (`|`, `&`, `-`, `^`), no `[::-1]`, `.upper()`, `.startswith()`, `sorted()` or `re`. Every line has an inline comment.
The tests compare each hand-written function against the built-in version on random inputs to prove it is correct.
The JavaScript files only send input to Python and draw what comes back.

## Features

### Binary Tree
- Type an infix arithmetic expression such as `A+B/D-E`
- Switch the output between preorder, inorder and postorder at any time; the expression tree is redrawn with that order's visit numbers

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
- See the strings it generates path by path, one string per iteration (e.g. `A+B` gives `AB, AAB, AAAB ...`; `(A|B)*C+` gives `C, ACC, AACCC ...` and `C, BCC, BBCCC ...`)

## Run

```bash
cd /path/to/Traversal-Toolkit
./flask/bin/python app.py
```

Or with a normal virtual environment:

```bash
python3 -m venv flask
./flask/bin/pip install -r requirements-dev.txt
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

