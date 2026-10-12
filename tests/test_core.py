import random

import pytest

from traversal_toolkit import basics, expr_tree, regex_ops, set_ops, text_ops


# ---------- helper checks: the hand-written versions must agree with Python's built-ins ----------

def random_words(rng, alphabet, count, max_size):
    return [("".join(rng.choice(alphabet) for _ in range(rng.randint(0, max_size)))) for _ in range(count)]


def test_basics_match_builtins():
    rng = random.Random(1)
    for _ in range(200):
        items = [rng.randint(0, 9) for _ in range(rng.randint(0, 12))]
        assert basics.length(items) == len(items)
        assert basics.merge_sort(items, lambda x, y: x < y) == sorted(items)
        assert basics.contains(items, 5) == (5 in items)
        assert basics.join([str(i) for i in items], ", ") == ", ".join(str(i) for i in items)


# ---------- Text operations ----------

def test_text_operations_match_builtins():
    rng = random.Random(2)
    for text in random_words(rng, "abAB 12", 300, 9):
        assert text_ops.reverse(text) == text[::-1]
        assert text_ops.to_upper(text) == text.upper()
        assert text_ops.to_lower(text) == text.lower()
        assert text_ops.first_chars(text, 3) == text[:3]
        assert text_ops.last_chars(text, 3) == text[-3:]
        assert text_ops.unique_count(text) == len(set(text))
        for part in random_words(rng, "ab", 5, 3):
            assert text_ops.starts_with(text, part) == text.startswith(part)
            assert text_ops.ends_with(text, part) == text.endswith(part)
        assert text_ops.concatenate(text, "xy") == text + "xy"


def test_palindrome_rules():
    assert text_ops.is_palindrome("Race Car") is True
    assert text_ops.is_palindrome("abba") is True
    assert text_ops.is_palindrome("ab") is False
    assert text_ops.is_palindrome("2") is False  # one character is not a palindrome
    assert text_ops.is_palindrome("") is False  # neither is empty text
    assert text_ops.is_palindrome("a b") is False  # becomes "ab"


def test_text_analyze_rows():
    out = text_ops.analyze("", "abba", prefix="ab", suffix="ba")
    rows_a, rows_b = dict(out["a"]), dict(out["b"])
    assert rows_a["Is palindrome"] == "No text"  # empty text shows "No text", not Yes
    assert rows_b["Is palindrome"] is True
    assert rows_b['Starts with "ab"'] is True and rows_b['Ends with "ba"'] is True
    assert dict(out["combined"])["Concatenation (A + B)"] == "abba"
    assert text_ops.analyze("", "") == {"empty": True}


def test_prefix_and_suffix_outputs_show_all_progressive_values():
    rows = dict(text_ops.string_ops("gab", "xyz"))
    assert rows["Prefixes of A"] == "g ga gab"
    assert rows["Suffixes of A"] == "b ab gab"
    assert rows["Prefixes of B"] == "x xy xyz"
    assert rows["Suffixes of B"] == "z yz xyz"



# ---------- Sets ----------

def test_set_operations_match_builtins():
    rng = random.Random(3)
    for _ in range(300):
        a = set_ops.parse_set(" ".join(random_words(rng, "12345", 4, 2)))
        b = set_ops.parse_set(", ".join(random_words(rng, "12345", 4, 2)))
        sa, sb = set(a), set(b)
        assert set(set_ops.union(a, b)) == sa | sb
        assert set(set_ops.intersection(a, b)) == sa & sb
        assert set(set_ops.difference(a, b)) == sa - sb
        assert set(set_ops.symmetric_difference(a, b)) == sa ^ sb
        assert set_ops.is_subset(a, b) == (sa <= sb)
        assert set_ops.is_superset(a, b) == (sa >= sb)
        assert set_ops.is_disjoint(a, b) == sa.isdisjoint(sb)
        assert len(set_ops.union(a, b)) == len(sa | sb)  # no duplicates sneak in


def test_power_set_and_cartesian_product():
    items = ["1", "2", "3"]
    subsets = set_ops.power_set(items)
    assert len(subsets) == 8 and subsets[0] == []  # 2^3 subsets, empty set first
    assert sorted(len(s) for s in subsets) == [len(s) for s in subsets]  # smallest first
    assert set_ops.cartesian_product(["1", "2"], ["x", "y"]) == [["1", "x"], ["1", "y"], ["2", "x"], ["2", "y"]]
    assert set_ops.cartesian_product([], ["x"]) == []


def test_set_parsing_and_display():
    assert set_ops.parse_set("1, 2 2,,  3") == ["1", "2", "3"]  # duplicates and extra separators ignored
    assert set_ops.format_set(["10", "2", "1"]) == "{1, 2, 10}"  # numbers sort as numbers


def test_set_analyze_payload():
    out = set_ops.analyze("1 2", "x y")
    assert dict(out["table"])["Union (A ∪ B)"] == "{1, 2, x, y}"
    assert dict(out["table"])["Symmetric difference (A Δ B)"] == "{1, 2, x, y}"
    assert dict(out["table"])["Disjoint"] is True
    assert out["products"][0]["count"] == 4 and out["products"][0]["name"] == "A × B"
    assert out["powers"][0]["count"] == 4 and len(out["powers"][0]["subsets"]) == 4
    assert set_ops.analyze("", "") == {"empty": True}
    big = set_ops.analyze(" ".join(str(i) for i in range(12)), "a")  # 2^12 subsets is too many to list
    assert big["powers"][0]["subsets"] is None and big["powers"][0]["count"] == 4096


# ---------- Binary Tree (expression trees) ----------

def test_expression_traversals():
    out = expr_tree.analyze("A+B/D-E")
    assert out["prefix"] == "- + A / B D E"
    assert out["infix"] == "((A+(B/D))-E)"
    assert out["postfix"] == "A B D / + E -"
    assert out["tree"]["v"] == "-" and out["tree"]["pre"] == 1 and out["tree"]["post"] == 7


def test_expression_precedence_and_brackets():
    assert expr_tree.analyze("A+B*C")["postfix"] == "A B C * +"  # * binds tighter than +
    assert expr_tree.analyze("(A+B)*C")["postfix"] == "A B + C *"  # brackets change the order
    assert expr_tree.analyze("A-B-C")["postfix"] == "A B - C -"  # left to right
    assert expr_tree.analyze("A^B^C")["postfix"] == "A B C ^ ^"  # ^ groups from the right
    assert expr_tree.analyze("x1 + 3.5")["postfix"] == "x1 3.5 +"  # multi-character operands


def test_expression_bad_input_rejected():
    for bad in ("", "   ", "A+", "+A", "(A+B", "A+B)", "A B", "A$B"):
        with pytest.raises(ValueError):
            expr_tree.analyze(bad)


# ---------- Regular operations ----------

def test_regex_plus_generates_repeats():
    assert regex_ops.generate("A+BC", 6)["words"] == ["ABC", "AABC", "AAABC", "AAAABC"]


def test_regex_star_alternation_and_groups():
    assert regex_ops.generate("A*B", 3)["words"] == ["B", "AB", "AAB"]
    assert regex_ops.generate("A|BC", 5)["words"] == ["A", "BC"]
    assert regex_ops.generate("(AB)+", 6)["words"] == ["AB", "ABAB", "ABABAB"]
    assert "" in regex_ops.generate("(A|B)*", 2)["words"]
    assert regex_ops.generate("(A|B)*", 2)["words"] == ["", "A", "B", "AA", "AB", "BA", "BB"]
    assert regex_ops.generate("A(B|C)*", 3)["words"] == ["A", "AB", "AC", "ABB", "ABC", "ACB", "ACC"]


def test_regex_matches_python_re():  # cross-check against the built-in regular expression engine
    import re

    for pattern in ("A+BC", "A*B", "(AB)+", "A|BC", "(A|B)*C", "(AB|C)+D", "A(B|C)*", "(A*B)+", "((A|B)C)*"):
        words = regex_ops.generate(pattern, 6)["words"]
        expected = []
        for size in range(7):
            for word in itertools_words("ABCD", size):
                if re.fullmatch(pattern, word):
                    expected.append(word)
        assert words == expected, pattern


def itertools_words(alphabet, size):
    import itertools

    return ["".join(p) for p in itertools.product(alphabet, repeat=size)]


def test_regex_read_and_limits():
    assert regex_ops.generate("A+BC")["read"] == "A+ · B · C"
    assert regex_ops.generate("A*", 99)["max_len"] == regex_ops.MAX_LEN_LIMIT  # asked for too long
    assert regex_ops.generate("A*", "oops")["max_len"] == 6  # unreadable length falls back to the default


def test_regex_worst_case_is_fast():
    import time

    start = time.time()
    regex_ops.generate("(A|B|C)*(A|B|C)*(A|B)*", 10)  # a huge language: the cap must keep it quick
    assert time.time() - start < 3


def test_regex_bad_input_rejected():
    for bad in ("(A", "A)", "|A", "()", "+A", "", "A\\"):
        with pytest.raises(ValueError):
            regex_ops.generate(bad)


# ---------- App wiring ----------

def test_api_routes():
    from app import app

    client = app.test_client()
    assert client.post("/api/expression", json={"expr": "A+B"}).status_code == 200
    assert client.post("/api/expression", json={"expr": "A+"}).status_code == 400
    assert client.post("/api/text", json={"a": "abba", "b": ""}).get_json()["empty"] is False
    assert client.post("/api/sets", json={"a": "1", "b": "2"}).get_json()["empty"] is False
    assert client.post("/api/regex", json={"regex": "A+BC"}).get_json()["count"] == 4
    assert client.post("/api/regex", json={"regex": "("}).status_code == 400


def test_static_files_are_served_from_public_folder():
    from app import app

    client = app.test_client()
    for name in ("app.js", "tree.js", "text.js", "set.js", "regex.js", "style.css"):
        assert client.get(f"/static/{name}").status_code == 200, name


def test_index_renders_sidebar_and_tabs():
    from pathlib import Path

    from app import app

    root = Path(__file__).resolve().parents[1]
    assert (root / "templates" / "sidebar.html").exists()
    assert (root / "templates" / "toolkit" / "tree.html").exists()
    assert (root / "templates" / "toolkit" / "text.html").exists()
    assert (root / "templates" / "toolkit" / "set.html").exists()

    client = app.test_client()
    response = client.get("/")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'data-page="tree"' in html
    assert 'data-page="text"' in html
    assert 'data-page="set"' in html
    assert "Automata Toolkit" in html
