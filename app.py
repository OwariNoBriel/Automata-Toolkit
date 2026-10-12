"""Automata Toolkit web app.  Run:  python app.py  ->  http://127.0.0.1:5000"""
from flask import Flask, jsonify, render_template, request

from traversal_toolkit import expr_tree, regex_ops

# Static files live in public/ because Vercel serves public/** from its CDN
# (Flask's own static folder is ignored there). Locally Flask serves the same folder.
app = Flask(__name__, static_folder="public/static", static_url_path="/static")
expr_tree.register(app)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/regex")
def regex():
    d = request.get_json(force=True) or {}
    try:
        return jsonify(regex_ops.generate(d.get("regex", ""), d.get("max_len", 6)))
    except ValueError as e:
        return jsonify(error=str(e)), 400


if __name__ == "__main__":
    app.run(debug=True)
