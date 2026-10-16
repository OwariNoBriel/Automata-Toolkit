"""Automata Toolkit web app.  Run:  python app.py  ->  http://127.0.0.1:5000"""  # what this file is for
from flask import Flask, jsonify, render_template, request  # the web framework pieces we use

from traversal_toolkit import expr_tree, regex_ops, set_ops, text_ops  # the lessons, one module per tab

# Static files live in public/ because Vercel serves public/** from its CDN
# (Flask's own static folder is ignored there). Locally Flask serves the same folder.
app = Flask(__name__, static_folder="public/static", static_url_path="/static")  # create the web app


def _data():  # read the JSON the browser sent
    return request.get_json(force=True, silent=True) or {}  # an empty dictionary if nothing usable arrived


def _text(data, key):  # read one text field safely
    value = data.get(key)  # look the field up
    if value is None:  # the field was not sent
        return ""  # treat it as empty text
    return str(value)  # make sure it is text


@app.get("/")  # the home page
def index():  # serve the one-page app
    return render_template("index.html")  # fill in templates/index.html


@app.post("/api/expression")  # Binary Tree tab
def expression():  # build the tree for a typed expression
    try:  # the expression may be malformed
        return jsonify(expr_tree.analyze(_text(_data(), "expr")))  # send the tree and traversals
    except ValueError as e:  # the lesson explained what is wrong
        return jsonify(error=str(e)), 400  # send the explanation with an error status


@app.post("/api/text")  # Text Operations tab
def text():  # run the text operations
    d = _data()  # what the browser sent
    return jsonify(text_ops.analyze(_text(d, "a"), _text(d, "b"), _text(d, "prefix"), _text(d, "suffix")))  # send the rows


@app.post("/api/sets")  # Sets tab
def sets():  # run the set operations
    d = _data()  # what the browser sent
    return jsonify(set_ops.analyze(_text(d, "a"), _text(d, "b")))  # send the rows, products and power sets


@app.post("/api/regex")  # Regular Operations tab
def regex():  # list the strings an expression produces, path by path
    d = _data()  # what the browser sent
    try:  # the expression may be malformed
        return jsonify(regex_ops.generate(_text(d, "regex"), d.get("iterations", 4)))  # send the strings
    except ValueError as e:  # the lesson explained what is wrong
        return jsonify(error=str(e)), 400  # send the explanation with an error status


if __name__ == "__main__":  # only when started with "python app.py"
    app.run(debug=True)  # start the local development server
