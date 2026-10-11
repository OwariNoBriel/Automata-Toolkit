import pytest

from traversal_toolkit import regex_ops, set_ops, string_extra, text_ops, tree

PRE, INO, POST = ["A", "B", "D", "E", "C", "F"], ["D", "B", "E", "A", "F", "C"], ["D", "E", "B", "F", "C", "A"]


def test_build_from_pre_in():
    r = tree.build(PRE, INO, [])
    assert tree.postorder(r) == POST and tree.height(r) == 3


def test_build_from_post_in():
    assert tree.preorder(tree.build([], INO, POST)) == PRE


def test_mismatched_traversals_rejected():
    with pytest.raises(ValueError):
        tree.build(PRE, INO, list(reversed(POST)))


def test_needs_inorder():
    with pytest.raises(ValueError):
        tree.build(PRE, [], POST)


def test_string_ops():
    rows = dict(text_ops.string_ops("ABC", "XY"))
    assert rows["Concatenation (A + B)"] == "ABCXY" and rows["Reverse of A"] == "CBA"


def test_set_ops():
    rows = dict(set_ops.set_ops(["A", "B"], ["B", "C"]))
    assert rows["Intersection (A ∩ B)"] == "{B}" and rows["Symmetric difference (A Δ B)"] == "{A, C}"


def test_string_extra_ops():
    rows = dict(string_extra.string_extra_ops("race car", "ABC"))
    assert rows["Prefix of A"] == "rac"
    assert rows["Suffix of A"] == "car"
    assert rows["Reverse of A"] == "rac ecar"
    assert rows["A is a palindrome"] is True
    assert rows["Reverse of B"] == "CBA"
    assert rows["B is a palindrome"] is False


def test_single_character_is_not_a_palindrome():
    assert dict(string_extra.string_extra_ops("2", "a b"))["A is a palindrome"] is False
    assert dict(string_extra.string_extra_ops("2", "a b"))["B is a palindrome"] is False
    assert dict(text_ops.string_ops("2", "x"))["A is a palindrome"] is False
    assert dict(string_extra.string_extra_ops("22", "x"))["A is a palindrome"] is True


def test_empty_text_is_not_a_palindrome():
    assert dict(string_extra.string_extra_ops("", "abba"))["A is a palindrome"] is False
    assert dict(string_extra.string_extra_ops("", "abba"))["B is a palindrome"] is True
    assert dict(text_ops.string_ops("", "x"))["A is a palindrome"] is False


def test_index_renders_sidebar_and_tabs():
    from pathlib import Path

    from app import app

    root = Path(__file__).resolve().parents[1]
    assert (root / "templates" / "sidebar.html").exists()
    assert (root / "templates" / "toolkit" / "tree.html").exists()
    assert (root / "templates" / "toolkit" / "text.html").exists()
    assert (root / "templates" / "toolkit" / "set.html").exists()
    assert (root / "static" / "tree.js").exists()
    assert (root / "static" / "text.js").exists()
    assert (root / "static" / "set.js").exists()

    client = app.test_client()
    response = client.get("/")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'data-page="tree"' in html
    assert 'data-page="text"' in html
    assert 'data-page="set"' in html
    assert 'tree.js' in html
    assert 'text.js' in html
    assert 'set.js' in html
    assert "Automata Toolkit" in html


def test_regex_plus_generates_repeats():
    assert regex_ops.generate("A+BC", 6)["words"] == ["ABC", "AABC", "AAABC", "AAAABC"]


def test_regex_star_alternation_and_groups():
    assert regex_ops.generate("A*B", 3)["words"] == ["B", "AB", "AAB"]
    assert regex_ops.generate("A|BC", 5)["words"] == ["A", "BC"]
    assert regex_ops.generate("(AB)+", 6)["words"] == ["AB", "ABAB", "ABABAB"]
    assert "" in regex_ops.generate("(A|B)*", 2)["words"]


def test_regex_bad_input_rejected():
    for bad in ("(A", "A)", "|A", "()", "+A", ""):
        with pytest.raises(ValueError):
            regex_ops.generate(bad)
