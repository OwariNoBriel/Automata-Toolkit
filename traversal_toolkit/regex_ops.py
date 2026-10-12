"""Regular operations written by hand: parse an expression, then list the strings it produces.

Operators (highest precedence first):
    ( )   grouping
    * +   Kleene star (zero or more) / Kleene plus (one or more)
          concatenation (implicit: 'ab' = a then b)
    |     alternation (union)
Any other character is a literal symbol.  Use \\ to escape an operator ( \\* ).
"""  # what this file is for
from .basics import contains, join, length, merge_sort  # our own helpers instead of built-in shortcuts

META = "|*+()"  # the characters that are operators, not letters
CAP = 2000  # stop collecting after this many strings (keeps the page fast)
MAX_LEN_LIMIT = 10  # the longest string length we ever generate


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


# ---------- generation: expression -> the strings it produces ----------

class Language:  # a collection of distinct strings, stored in boxes by length
    def __init__(self, limit):  # make an empty collection for strings up to length limit
        self.limit = limit  # the longest string we keep
        self.boxes = []  # boxes[k] holds the strings of length k
        for _ in range(limit + 1):  # one box for each length 0, 1, 2 ... limit
            self.boxes.append([])  # start with an empty box
        self.seen = {}  # a quick "already stored?" lookup table (words as keys)
        self.count = 0  # how many strings are stored

    def add(self, word, size):  # store a string of the given length unless we already have it
        if size > self.limit or self.count >= CAP:  # too long, or we are full
            return False  # do not store it
        if word in self.seen:  # we already have this exact string
            return False  # do not store it twice
        self.seen[word] = True  # remember that we have it
        self.boxes[size].append(word)  # put it in the box for its length
        self.count += 1  # one more string stored
        return True  # it was new


def _join(xs, ys, limit):  # concatenation: every string of xs followed by every string of ys
    out = Language(limit)  # the answer collection
    for lx in range(limit + 1):  # for each possible length of the first part
        for ly in range(limit - lx + 1):  # and each length of the second part that still fits
            for x in xs.boxes[lx]:  # every first part of that length
                for y in ys.boxes[ly]:  # every second part of that length
                    out.add(x + y, lx + ly)  # glue them together and store the result
    return out  # all the joined strings


def _union(xs, ys, limit):  # alternation: strings from xs or from ys
    out = Language(limit)  # the answer collection
    for k in range(limit + 1):  # go through every length
        for word in xs.boxes[k]:  # every string from the left side
            out.add(word, k)  # store it
        for word in ys.boxes[k]:  # every string from the right side
            out.add(word, k)  # store it (strings already stored are skipped)
    return out  # all strings from either side


def _star(xs, limit):  # Kleene star: repeat zero, one, two ... times
    out = Language(limit)  # the answer collection
    out.add("", 0)  # repeating zero times gives the empty string
    frontier = [("", 0)]  # the strings found in the latest round
    while length(frontier) > 0 and out.count < CAP:  # keep going while new strings appear
        found = []  # the new strings of this round
        for word, wsize in frontier:  # extend each string of the last round
            for k in range(1, limit - wsize + 1):  # by one more repeat of length k (it must still fit)
                for x in xs.boxes[k]:  # every string that may be repeated
                    if out.add(word + x, wsize + k):  # glue one more repeat on
                        found.append((word + x, wsize + k))  # a new string: extend it again next round
        frontier = found  # the next round starts from the new strings
    return out  # every repeat count that fits in the limit


def _lang(n, limit):  # the strings a syntax tree produces, up to length limit
    k = n[0]  # which kind of node this is
    if k == "sym":  # a single symbol
        out = Language(limit)  # the answer collection
        out.add(n[1], 1)  # the only string is that symbol (length 1)
        return out  # done
    if k == "cat":  # concatenation
        return _join(_lang(n[1], limit), _lang(n[2], limit), limit)  # left strings followed by right strings
    if k == "alt":  # alternation
        return _union(_lang(n[1], limit), _lang(n[2], limit), limit)  # left strings or right strings
    base = _lang(n[1], limit)  # star / plus: the strings that get repeated
    repeated = _star(base, limit)  # zero or more repeats of them
    if k == "star":  # Kleene star
        return repeated  # zero or more repeats
    return _join(base, repeated, limit)  # Kleene plus: one copy, then zero or more repeats


def _before(x, y):  # alphabetical order for two strings of the same length
    return x < y  # compare letter by letter


def generate(regex, max_len=6):  # all strings the expression produces up to max_len, shortest first
    try:  # the length may arrive as text or a number
        max_len = int(max_len)  # turn it into a whole number
    except (TypeError, ValueError):  # it could not be read
        max_len = 6  # fall back to the default
    if max_len > MAX_LEN_LIMIT:  # asked for too long
        max_len = MAX_LEN_LIMIT  # cap it
    if max_len < 1:  # asked for too short
        max_len = 1  # raise it
    tree = parse(regex)  # read the expression (raises ValueError if malformed)
    language = _lang(tree, max_len)  # work out every string that fits
    words = []  # the final list, shortest first
    for k in range(max_len + 1):  # go through the lengths in order
        for word in merge_sort(language.boxes[k], _before):  # strings of this length, alphabetical
            words.append(word)  # add to the final list
    return {  # the full answer for the page
        "read": describe(tree),  # how the operators were grouped
        "max_len": max_len,  # the length limit that was used
        "count": length(words),  # how many strings there are
        "capped": length(words) >= CAP,  # True if we stopped early
        "words": words,  # the strings themselves
    }
