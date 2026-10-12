import random                                                                                       # load Python's random-number tools (used to make random test data)

import pytest                                                                                       # load pytest, the testing tool (used here to check that errors are raised)

from traversal_toolkit import basics, expr_tree, regex_ops, set_ops, text_ops                       # load the project modules that are being tested


# ---------- helper checks: the hand-written versions must agree with Python's built-ins ----------

def random_words(rng, alphabet, count, max_size):                                                   # helper: makes `count` random words from `alphabet`, each up to `max_size` long
    return [("".join(rng.choice(alphabet) for _ in range(rng.randint(0, max_size)))) for _ in range(count)]  # build the list: each word is random letters joined together, with a random length from 0 to max_size


def test_basics_match_builtins():                                                                   # test: the hand-written helpers must give the same answers as Python's built-ins
    rng = random.Random(1)                                                                          # random generator with a fixed seed, so every run uses the same data
    for _ in range(200):                                                                            # repeat 200 times with new random data
        items = [rng.randint(0, 9) for _ in range(rng.randint(0, 12))]                              # make a random list of 0 to 12 numbers (each from 0 to 9)
        assert basics.length(items) == len(items)                                                   # your length() must equal Python's len()
        assert basics.merge_sort(items, lambda x, y: x < y) == sorted(items)                        # your merge sort must give the same order as Python's sorted()
        assert basics.contains(items, 5) == (5 in items)                                            # your contains() must agree with the `in` operator
        assert basics.join([str(i) for i in items], ", ") == ", ".join(str(i) for i in items)       # your join() must agree with Python's str.join()


# ---------- Text operations ----------

def test_text_operations_match_builtins():                                                          # test: your text operations must match Python's own string methods
    rng = random.Random(2)                                                                          # fixed seed again, so results are repeatable
    for text in random_words(rng, "abAB 12", 300, 9):                                               # try 300 random texts made from the characters a, b, A, B, space, 1, 2
        assert text_ops.reverse(text) == text[::-1]                                                 # reverse must equal slicing the text backwards
        assert text_ops.to_upper(text) == text.upper()                                              # to_upper must equal .upper()
        assert text_ops.to_lower(text) == text.lower()                                              # to_lower must equal .lower()
        assert text_ops.first_chars(text, 3) == text[:3]                                            # first 3 characters must equal text[:3]
        assert text_ops.last_chars(text, 3) == text[-3:]                                            # last 3 characters must equal text[-3:]
        assert text_ops.unique_count(text) == len(set(text))                                        # number of different characters must equal the size of the set of the text
        for part in random_words(rng, "ab", 5, 3):                                                  # also try 5 short random pieces (made of a and b) as prefixes and suffixes
            assert text_ops.starts_with(text, part) == text.startswith(part)                        # starts_with must equal .startswith()
            assert text_ops.ends_with(text, part) == text.endswith(part)                            # ends_with must equal .endswith()
        assert text_ops.concatenate(text, "xy") == text + "xy"                                      # concatenate must equal joining with +


def test_palindrome_rules():                                                                        # test: palindrome rules, one example per rule
    assert text_ops.is_palindrome("Race Car") is True                                               # spaces and capital letters are ignored, so this is a palindrome
    assert text_ops.is_palindrome("abba") is True                                                   # reads the same forwards and backwards
    assert text_ops.is_palindrome("ab") is False                                                    # does not read the same backwards
    assert text_ops.is_palindrome("2") is False  # one character is not a palindrome
    assert text_ops.is_palindrome("") is False  # neither is empty text
    assert text_ops.is_palindrome("a b") is False  # becomes "ab"


def test_text_analyze_rows():                                                                       # test: the rows shown in the Text Operations tables
    out = text_ops.analyze("", "abba", prefix="ab", suffix="ba")                                    # analyze with Text A empty, Text B 'abba', and a prefix and suffix to check
    rows_a, rows_b = dict(out["a"]), dict(out["b"])                                                 # turn each result table (a list of label/answer pairs) into a dictionary so values can be looked up by label
    assert rows_a["Is palindrome"] == "No text"  # empty text shows "No text", not Yes
    assert rows_b["Is palindrome"] is True                                                          # 'abba' is a palindrome
    assert rows_b['Starts with "ab"'] is True and rows_b['Ends with "ba"'] is True                  # 'abba' starts with 'ab' and ends with 'ba'
    assert dict(out["combined"])["Concatenation (A + B)"] == "abba"                                 # '' joined with 'abba' gives 'abba'
    assert text_ops.analyze("", "") == {"empty": True}                                              # both texts empty: the result is just {'empty': True}


def test_prefix_and_suffix_outputs_show_all_progressive_values():                                   # test: prefixes and suffixes list every step, from shortest to the full text
    rows = dict(text_ops.string_ops("gab", "xyz"))                                                  # run the string operations on 'gab' and 'xyz' and make a lookup dictionary
    assert rows["Prefixes of A"] == "g ga gab"                                                      # prefixes of 'gab': g, ga, gab
    assert rows["Suffixes of A"] == "b ab gab"                                                      # suffixes of 'gab': b, ab, gab
    assert rows["Prefixes of B"] == "x xy xyz"                                                      # prefixes of 'xyz': x, xy, xyz
    assert rows["Suffixes of B"] == "z yz xyz"                                                      # suffixes of 'xyz': z, yz, xyz



# ---------- Sets ----------

def test_set_operations_match_builtins():                                                           # test: your set operations must match Python's built-in sets
    rng = random.Random(3)                                                                          # fixed seed, so every run uses the same data
    for _ in range(300):                                                                            # repeat 300 times with new random data
        a = set_ops.parse_set(" ".join(random_words(rng, "12345", 4, 2)))                           # make Set A from random words separated by spaces
        b = set_ops.parse_set(", ".join(random_words(rng, "12345", 4, 2)))                          # make Set B from random words separated by commas
        sa, sb = set(a), set(b)                                                                     # Python's own sets of A and B, used as the correct answer
        assert set(set_ops.union(a, b)) == sa | sb                                                  # union must equal Python's | operator
        assert set(set_ops.intersection(a, b)) == sa & sb                                           # intersection must equal Python's & operator
        assert set(set_ops.difference(a, b)) == sa - sb                                             # difference (A - B) must equal Python's - operator
        assert set(set_ops.symmetric_difference(a, b)) == sa ^ sb                                   # symmetric difference must equal Python's ^ operator
        assert set_ops.is_subset(a, b) == (sa <= sb)                                                # is_subset must equal <=
        assert set_ops.is_superset(a, b) == (sa >= sb)                                              # is_superset must equal >=
        assert set_ops.is_disjoint(a, b) == sa.isdisjoint(sb)                                       # is_disjoint must equal .isdisjoint()
        assert len(set_ops.union(a, b)) == len(sa | sb)  # no duplicates sneak in


def test_power_set_and_cartesian_product():                                                         # test: power set (all subsets) and Cartesian product (all pairs)
    items = ["1", "2", "3"]                                                                         # a small example set
    subsets = set_ops.power_set(items)                                                              # list every subset of the set
    assert len(subsets) == 8 and subsets[0] == []  # 2^3 subsets, empty set first
    assert sorted(len(s) for s in subsets) == [len(s) for s in subsets]  # smallest first
    assert set_ops.cartesian_product(["1", "2"], ["x", "y"]) == [["1", "x"], ["1", "y"], ["2", "x"], ["2", "y"]]  # every pair (one from each set) in order
    assert set_ops.cartesian_product([], ["x"]) == []                                               # a product with an empty set has no pairs


def test_set_parsing_and_display():                                                                 # test: how typed text becomes a set, and how a set is shown
    assert set_ops.parse_set("1, 2 2,,  3") == ["1", "2", "3"]  # duplicates and extra separators ignored
    assert set_ops.format_set(["10", "2", "1"]) == "{1, 2, 10}"  # numbers sort as numbers


def test_set_analyze_payload():                                                                     # test: the full result the Sets page gets back
    out = set_ops.analyze("1 2", "x y")                                                             # analyze Set A = {1, 2} and Set B = {x, y}
    assert dict(out["table"])["Union (A ∪ B)"] == "{1, 2, x, y}"                                    # union has all four elements
    assert dict(out["table"])["Symmetric difference (A Δ B)"] == "{1, 2, x, y}"                     # nothing is shared, so the symmetric difference is also all four
    assert dict(out["table"])["Disjoint"] is True                                                   # the sets share nothing, so they are disjoint
    assert out["products"][0]["count"] == 4 and out["products"][0]["name"] == "A × B"               # A × B has 2 x 2 = 4 pairs
    assert out["powers"][0]["count"] == 4 and len(out["powers"][0]["subsets"]) == 4                 # a set of 2 elements has 2^2 = 4 subsets
    assert set_ops.analyze("", "") == {"empty": True}                                               # both sets empty: the result is just {'empty': True}
    big = set_ops.analyze(" ".join(str(i) for i in range(12)), "a")  # 2^12 subsets is too many to list
    assert big["powers"][0]["subsets"] is None and big["powers"][0]["count"] == 4096                # too many subsets to list, so the list is None but the count is still 4096


# ---------- Binary Tree (expression trees) ----------

def test_expression_traversals():                                                                   # test: expression tree for A+B/D-E and its three traversals
    out = expr_tree.analyze("A+B/D-E")                                                              # build the expression tree and get its results
    assert out["prefix"] == "- + A / B D E"                                                         # prefix = preorder (operator first)
    assert out["infix"] == "((A+(B/D))-E)"                                                          # infix = inorder, with brackets showing the grouping
    assert out["postfix"] == "A B D / + E -"                                                        # postfix = postorder (operator last)
    assert out["tree"]["v"] == "-" and out["tree"]["pre"] == 1 and out["tree"]["post"] == 7         # the root is '-', and it is visited 1st in preorder and 7th in postorder


def test_expression_precedence_and_brackets():                                                      # test: operator order rules (comments on each line explain the rule)
    assert expr_tree.analyze("A+B*C")["postfix"] == "A B C * +"  # * binds tighter than +
    assert expr_tree.analyze("(A+B)*C")["postfix"] == "A B + C *"  # brackets change the order
    assert expr_tree.analyze("A-B-C")["postfix"] == "A B - C -"  # left to right
    assert expr_tree.analyze("A^B^C")["postfix"] == "A B C ^ ^"  # ^ groups from the right
    assert expr_tree.analyze("x1 + 3.5")["postfix"] == "x1 3.5 +"  # multi-character operands


def test_expression_bad_input_rejected():                                                           # test: invalid expressions must raise an error
    for bad in ("", "   ", "A+", "+A", "(A+B", "A+B)", "A B", "A$B"):                               # try each invalid expression: empty, spaces, missing operand, unbalanced brackets, missing operator, bad symbol
        with pytest.raises(ValueError):                                                             # this block passes only if a ValueError is raised
            expr_tree.analyze(bad)                                                                  # analyzing the invalid expression must fail


# ---------- Regular operations ----------

def test_regex_plus_generates_repeats():                                                            # test: the + operator (one or more repeats)
    assert regex_ops.generate("A+BC", 6)["words"] == ["ABC", "AABC", "AAABC", "AAAABC"]             # A+BC gives ABC, AABC, AAABC, AAAABC (words up to length 6)


def test_regex_star_alternation_and_groups():                                                       # test: * (zero or more), | (or) and ( ) groups
    assert regex_ops.generate("A*B", 3)["words"] == ["B", "AB", "AAB"]                              # A*B: B, AB, AAB (up to length 3)
    assert regex_ops.generate("A|BC", 5)["words"] == ["A", "BC"]                                    # A|BC: either 'A' or 'BC'
    assert regex_ops.generate("(AB)+", 6)["words"] == ["AB", "ABAB", "ABABAB"]                      # (AB)+: AB repeated one or more times
    assert "" in regex_ops.generate("(A|B)*", 2)["words"]                                           # (A|B)* includes the empty word
    assert regex_ops.generate("(A|B)*", 2)["words"] == ["", "A", "B", "AA", "AB", "BA", "BB"]       # all words made of A and B up to length 2, shortest first
    assert regex_ops.generate("A(B|C)*", 3)["words"] == ["A", "AB", "AC", "ABB", "ABC", "ACB", "ACC"]  # A followed by any mix of B and C


def test_regex_matches_python_re():  # cross-check against the built-in regular expression engine
    import re                                                                                       # load Python's built-in regular expressions to check our answers

    for pattern in ("A+BC", "A*B", "(AB)+", "A|BC", "(A|B)*C", "(AB|C)+D", "A(B|C)*", "(A*B)+", "((A|B)C)*"):  # try each pattern in this list
        words = regex_ops.generate(pattern, 6)["words"]                                             # words produced by our generator (up to length 6)
        expected = []                                                                               # list for the correct words
        for size in range(7):                                                                       # check word lengths 0 to 6
            for word in itertools_words("ABCD", size):                                              # every possible word of this length using A, B, C, D
                if re.fullmatch(pattern, word):                                                     # keep the word only if Python's regex matches the whole word
                    expected.append(word)                                                           # add it to the correct list
        assert words == expected, pattern                                                           # our generator must give exactly the same words (the pattern is shown if it fails)


def itertools_words(alphabet, size):                                                                # helper: every word of a given length from the alphabet
    import itertools                                                                                # load itertools (for combinations)

    return ["".join(p) for p in itertools.product(alphabet, repeat=size)]                           # product() makes every combination; join turns each into a string


def test_regex_read_and_limits():                                                                   # test: the 'read' text and the length limits
    assert regex_ops.generate("A+BC")["read"] == "A+ · B · C"                                       # the regex is shown split into parts
    assert regex_ops.generate("A*", 99)["max_len"] == regex_ops.MAX_LEN_LIMIT  # asked for too long
    assert regex_ops.generate("A*", "oops")["max_len"] == 6  # unreadable length falls back to the default


def test_regex_worst_case_is_fast():                                                                # test: a huge pattern must not freeze the app
    import time                                                                                     # load time (to measure how long it takes)

    start = time.time()                                                                             # note the start time
    regex_ops.generate("(A|B|C)*(A|B|C)*(A|B)*", 10)  # a huge language: the cap must keep it quick
    assert time.time() - start < 3                                                                  # it must finish in under 3 seconds


def test_regex_bad_input_rejected():                                                                # test: invalid regular expressions must raise an error
    for bad in ("(A", "A)", "|A", "()", "+A", "", "A\\"):                                           # try each invalid regex: unbalanced brackets, misplaced operators, empty, trailing backslash
        with pytest.raises(ValueError):                                                             # this block passes only if a ValueError is raised
            regex_ops.generate(bad)                                                                 # generating from the invalid regex must fail


# ---------- App wiring ----------

def test_api_routes():                                                                              # test: the web routes answer correctly
    from app import app                                                                             # load the Flask app

    client = app.test_client()                                                                      # a fake browser for sending requests without starting the server
    assert client.post("/api/expression", json={"expr": "A+B"}).status_code == 200                  # a valid expression: status 200 (OK)
    assert client.post("/api/expression", json={"expr": "A+"}).status_code == 400                   # an invalid expression: status 400 (bad request)
    assert client.post("/api/text", json={"a": "abba", "b": ""}).get_json()["empty"] is False       # text route with 'abba' returns a real result (not empty)
    assert client.post("/api/sets", json={"a": "1", "b": "2"}).get_json()["empty"] is False         # sets route with {1} and {2} returns a real result
    assert client.post("/api/regex", json={"regex": "A+BC"}).get_json()["count"] == 4               # regex route returns the 4 words
    assert client.post("/api/regex", json={"regex": "("}).status_code == 400                        # an invalid regex: status 400


def test_static_files_are_served_from_public_folder():                                              # test: all the JS and CSS files can be loaded
    from app import app                                                                             # load the Flask app

    client = app.test_client()                                                                      # fake browser for requests
    for name in ("app.js", "tree.js", "text.js", "set.js", "regex.js", "style.css"):                # check each static file
        assert client.get(f"/static/{name}").status_code == 200, name                               # each file must load with status 200 (the name is shown if it fails)


def test_index_renders_sidebar_and_tabs():                                                          # test: the main page and its template files exist
    from pathlib import Path                                                                        # load Path (for working with file locations)

    from app import app                                                                             # load the Flask app

    root = Path(__file__).resolve().parents[1]                                                      # the project folder (one level above the tests folder)
    assert (root / "templates" / "sidebar.html").exists()                                           # the sidebar template file must exist
    assert (root / "templates" / "toolkit" / "tree.html").exists()                                  # the Binary Tree template must exist
    assert (root / "templates" / "toolkit" / "text.html").exists()                                  # the Text template must exist
    assert (root / "templates" / "toolkit" / "set.html").exists()                                   # the Sets template must exist

    client = app.test_client()                                                                      # fake browser for requests
    response = client.get("/")                                                                      # open the home page

    assert response.status_code == 200                                                              # the page must load (status 200)
    html = response.get_data(as_text=True)                                                          # get the page's HTML as text
    assert 'data-page="tree"' in html                                                               # the sidebar has the Binary Tree item
    assert 'data-page="text"' in html                                                               # the sidebar has the Text item
    assert 'data-page="set"' in html                                                                # the sidebar has the Sets item
    assert "Automata Toolkit" in html                                                               # the page title text appears