"""Regular operations written by hand: parse an expression, then list the strings it produces.

Operators (highest precedence first):
    ( )   grouping
    * +   Kleene star (zero or more) / Kleene plus (one or more)
          concatenation (implicit: 'ab' = a then b)
    |     alternation (union)
Any other character is a literal symbol.  Use \\ to escape an operator ( \\* ).

Generation is a depth-first derivation along ONE path at a time, counted in iterations (not string length):
    - each "|" is settled once per path, so (A|B)*C+ has two paths: the A path and the B path
    - on iteration j, every "+" repeats its part j times and every "*" repeats its part j-1 times
      (so A+B gives AB, AAB, AAAB ... and (A|B)*C+ gives C, ACC, AACCC ... then C, BCC, BBCCC ...)
"""  # what this file is for
from .basics import contains, join, length  # our own helpers instead of built-in shortcuts

META = "|*+()"  # the characters that are operators, not letters
MAX_ITER_LIMIT = 10  # the most iterations we ever run
DEFAULT_ITER = 4  # iterations used when none (or an unreadable one) is given
MAX_PATHS = 64  # stop listing paths after this many (keeps the page fast)
MAX_WORD_LEN = 2000  # a string longer than this ends its path (keeps the page fast)


def _is_space(ch):  # is this character blank space?
    return ch == " " or ch == "\t" or ch == "\n" or ch == "\r"  # space, tab or line break


# ---------- parsing: expression text -> syntax tree ----------
# Tree nodes are tuples: ("sym", c) ("cat", a, b) ("alt", a, b) ("star", a) ("plus", a)

def parse(text):  # read the expression and return its syntax tree
    toks = []  # the pieces found so far: ("op", c) or ("lit", c)
    i = 0  # our position in the text
    size = length(text)  # how many characters the text has
    while i < size:  # walk through the whole text
        c = text[i]  # the character at this position
        if _is_space(c):  # blanks carry no meaning
            i += 1  # skip over them
            continue  # look at the next character
        if c == "\\":  # a backslash escapes the next character
            if i + 1 >= size:  # nothing follows the backslash
                raise ValueError("Regex ends with a lone backslash.")  # report it
            toks.append(("lit", text[i + 1]))  # the next character is a plain letter, even if it looks like an operator
            i += 2  # skip both the backslash and the letter
            continue  # look at the next character
        if contains(META, c):  # an operator or a bracket
            toks.append(("op", c))  # keep it as an operator piece
        else:  # an ordinary symbol
            toks.append(("lit", c))  # keep it as a literal piece
        i += 1  # move to the next character
    if length(toks) == 0:  # nothing was typed
        raise ValueError("Enter a regular expression.")  # ask for input

    pos = 0  # which piece the parser is looking at

    def peek():  # look at the current piece without using it up
        if pos < length(toks):  # there are pieces left
            return toks[pos]  # show the current one
        return (None, None)  # a marker meaning "the end"

    def expr():  # expr = term ('|' term)*   (alternation, the weakest operator)
        nonlocal pos  # we change the shared position
        node = term()  # read the first branch
        while peek() == ("op", "|"):  # as long as another "|" follows
            pos += 1  # use up the "|"
            node = ("alt", node, term())  # combine both branches into an alternation
        return node  # the finished alternation

    def term():  # term = factor+   (concatenation)
        node = None  # nothing read yet
        while peek() != (None, None) and peek() != ("op", "|") and peek() != ("op", ")"):  # until the branch ends
            f = factor()  # read the next factor
            if node is None:  # it is the first factor
                node = f  # it becomes the whole term so far
            else:  # there was something before it
                node = ("cat", node, f)  # put the two side by side (concatenation)
        if node is None:  # the branch was empty
            raise ValueError("Missing operand: an empty branch, '()' or a trailing '|'.")  # report it
        return node  # the finished concatenation

    def factor():  # factor = atom ('*' | '+')*   (repetition binds tightest)
        nonlocal pos  # we change the shared position
        node = atom()  # read the thing that may be repeated
        while peek() == ("op", "*") or peek() == ("op", "+"):  # while repetition marks follow
            if toks[pos][1] == "*":  # a Kleene star
                node = ("star", node)  # zero or more repeats
            else:  # a Kleene plus
                node = ("plus", node)  # one or more repeats
            pos += 1  # use up the mark
        return node  # the finished factor

    def atom():  # atom = symbol | '(' expr ')'
        nonlocal pos  # we change the shared position
        kind, v = peek()  # what kind of piece is next, and which one
        if kind == "lit":  # a plain symbol
            pos += 1  # use it up
            return ("sym", v)  # it becomes a leaf of the tree
        if kind == "op" and v == "(":  # a group starts
            pos += 1  # use up the "("
            node = expr()  # read everything inside the brackets
            if peek() != ("op", ")"):  # the group was never closed
                raise ValueError("Missing closing ')'.")  # report it
            pos += 1  # use up the ")"
            return node  # the group is just the tree inside it
        raise ValueError("Operator '" + str(v) + "' has nothing to apply to.")  # an operator with no operand

    tree = expr()  # parse the whole expression
    if pos < length(toks):  # pieces are left over, so a ")" had no partner
        raise ValueError("Unmatched ')'.")  # report it
    return tree  # the syntax tree


# ---------- describing how the operators were grouped ----------

def _flat(n, kind):  # flatten nested binary cat/alt nodes into one list
    if n[0] == kind:  # this node is of the kind we are flattening
        result = []  # the flattened pieces
        for part in _flat(n[1], kind):  # flatten the left side
            result.append(part)  # keep each piece
        for part in _flat(n[2], kind):  # flatten the right side
            result.append(part)  # keep each piece
        return result  # all pieces side by side
    return [n]  # any other node is a single piece


def describe(n):  # readable form showing the grouping, e.g. 'A+ · B · C'
    k = n[0]  # which kind of node this is
    if k == "sym":  # a single symbol
        return n[1]  # just write it
    if k == "cat":  # a concatenation
        parts = []  # the written pieces
        for c in _flat(n, "cat"):  # every piece of the concatenation
            if c[0] == "alt":  # an alternation inside a concatenation needs brackets
                parts.append("(" + describe(c) + ")")  # wrap it
            else:  # anything else reads fine as it is
                parts.append(describe(c))  # write it
        return join(parts, " · ")  # pieces separated by a dot
    if k == "alt":  # an alternation
        parts = []  # the written pieces
        for c in _flat(n, "alt"):  # every branch of the alternation
            parts.append(describe(c))  # write it
        return join(parts, " | ")  # branches separated by a bar
    inner = describe(n[1])  # star / plus: first write what is repeated
    if n[1][0] == "cat" or n[1][0] == "alt":  # a repeated group needs brackets
        inner = "(" + inner + ")"  # wrap it
    if k == "star":  # Kleene star
        return inner + "*"  # zero or more
    return inner + "+"  # Kleene plus: one or more


# ---------- generation: expression -> one derivation per path ----------

def _paths(n):  # every way of settling the "|" choices: syntax trees with no alternation left
    k = n[0]  # which kind of node this is
    if k == "sym":  # a single symbol has only one way
        return [n]  # just itself
    if k == "alt":  # a choice: each branch starts its own paths
        out = []  # the answer list
        for branch in _paths(n[1]):  # paths through the left branch
            out.append(branch)  # keep each one
        for branch in _paths(n[2]):  # paths through the right branch
            out.append(branch)  # keep each one
        return out  # left paths first, then right paths
    if k == "cat":  # concatenation: every left path meets every right path
        out = []  # the answer list
        for left in _paths(n[1]):  # each way through the left part
            for right in _paths(n[2]):  # each way through the right part
                if length(out) < MAX_PATHS:  # stay under the limit
                    out.append(("cat", left, right))  # one combined path
        return out  # all the combined paths
    out = []  # star / plus: the choice inside is made once and reused every iteration
    for body in _paths(n[1]):  # each way through the repeated part
        out.append((k, body))  # wrap it back in its star or plus
    return out  # one path for each way through the body


def _repeats(n):  # does this tree contain a star or a plus anywhere?
    if n[0] == "sym":  # a symbol never repeats
        return False  # no
    if n[0] == "star" or n[0] == "plus":  # a repetition mark
        return True  # yes
    return _repeats(n[1]) or _repeats(n[2])  # cat: look at both sides


def _derive(n, j):  # the string this path gives on iteration j (j = 1, 2, 3 ...)
    k = n[0]  # which kind of node this is
    if k == "sym":  # a single symbol
        return n[1]  # it is written once
    if k == "cat":  # concatenation
        return _derive(n[1], j) + _derive(n[2], j)  # left string then right string
    body = _derive(n[1], j)  # star / plus: the part that gets repeated
    times = j - 1  # a star repeats j-1 times (zero times on the first iteration)
    if k == "plus":  # a plus repeats j times (at least once)
        times = j  # one more than a star
    text = ""  # the repeated text built so far
    for _ in range(times):  # one copy of the body for every repeat
        text = text + body  # glue another copy on
    return text  # the repeated text


def generate(regex, iterations=DEFAULT_ITER):  # one depth-first derivation per path, one string per iteration
    try:  # the iteration count may arrive as text or a number
        iterations = int(iterations)  # turn it into a whole number
    except (TypeError, ValueError):  # it could not be read
        iterations = DEFAULT_ITER  # fall back to the default
    if iterations > MAX_ITER_LIMIT:  # asked for too many
        iterations = MAX_ITER_LIMIT  # cap it
    if iterations < 1:  # asked for too few
        iterations = 1  # raise it
    tree = parse(regex)  # read the expression (raises ValueError if malformed)
    paths = []  # the finished paths, in order
    seen = []  # the paths already listed, so equal ones are not shown twice
    total = 0  # how many strings there are over all paths
    capped = False  # becomes True if we stopped early
    for path in _paths(tree):  # follow each path on its own
        label = describe(path)  # how this path reads, e.g. 'A* · C+'
        if contains(seen, label):  # an identical path was already listed
            continue  # skip the repeat
        seen.append(label)  # remember it
        words = []  # the strings of this path, one per iteration
        if _repeats(path):  # the path loops, so run it iteration by iteration
            for j in range(1, iterations + 1):  # iteration 1, 2, 3 ...
                word = _derive(path, j)  # the string for this iteration
                if length(word) > MAX_WORD_LEN:  # it grew too large
                    capped = True  # tell the page we stopped early
                    break  # end this path
                if not contains(words, word):  # keep each string once
                    words.append(word)  # add it
        else:  # nothing repeats: the path is just one string
            words.append(_derive(path, 1))  # derive it once
        total += length(words)  # count these strings
        paths.append({"path": label, "words": words})  # keep the path with its strings
    if length(paths) >= MAX_PATHS:  # we may have left paths out
        capped = True  # tell the page
    return {  # the full answer for the page
        "read": describe(tree),  # how the operators were grouped
        "iterations": iterations,  # the iteration count that was used
        "count": total,  # how many strings there are
        "capped": capped,  # True if we stopped early
        "paths": paths,  # the paths, each with its strings in iteration order
    }
