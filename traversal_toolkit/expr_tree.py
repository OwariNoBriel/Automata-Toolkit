"""Expression tree lesson: infix text -> tree -> prefix / infix / postfix, all written by hand."""  # what this file is for
from .basics import contains, join, length  # our own helpers instead of built-in shortcuts

PREC = {"+": 1, "-": 1, "*": 2, "/": 2, "^": 3}  # how strongly each operator binds (bigger = first)
RIGHT = ["^"]  # operators that group from the right: 2^3^2 means 2^(3^2)
OPERATORS = "+-*/^()"  # every single-character symbol the expression may contain


class Node:  # one box in the tree
    def __init__(self, v):  # make a node holding the value v
        self.v = v  # the operator or operand written in this node
        self.l = None  # the left child (empty for now)
        self.r = None  # the right child (empty for now)


def _is_space(ch):  # is this character blank space?
    return ch == " " or ch == "\t" or ch == "\n" or ch == "\r"  # space, tab or line break


def _is_word_char(ch):  # can this character be part of an operand such as A, x1 or 3.5?
    return ("a" <= ch <= "z") or ("A" <= ch <= "Z") or ("0" <= ch <= "9") or ch == "_" or ch == "."  # letters, digits, _ and .


def tokenize(text):  # cut the typed text into pieces: operands, operators and brackets
    tokens = []  # the pieces found so far
    i = 0  # our position in the text
    size = length(text)  # how many characters the text has
    while i < size:  # walk through the whole text
        ch = text[i]  # the character at this position
        if _is_space(ch):  # blanks carry no meaning
            i += 1  # skip over them
        elif contains(OPERATORS, ch):  # an operator or a bracket
            tokens.append(ch)  # it is a piece all by itself
            i += 1  # move to the next character
        elif _is_word_char(ch):  # the start of an operand
            word = ""  # the operand being collected
            while i < size and _is_word_char(text[i]):  # keep collecting while characters fit
                word = word + text[i]  # add this character to the operand
                i += 1  # move to the next character
            tokens.append(word)  # the whole operand is one piece
        else:  # a character we do not understand
            raise ValueError("Unsupported character. Use letters/numbers and + - * / ^ ( )")  # explain the problem
    if length(tokens) == 0:  # nothing but blanks (or nothing at all)
        raise ValueError("Type an expression first, e.g. A+B/D-E")  # ask for input
    return tokens  # the list of pieces


def to_postfix(tokens):  # shunting-yard: reorder the pieces so operators follow their operands
    out = []  # the postfix result
    ops = []  # a stack that holds operators waiting their turn
    for t in tokens:  # go through the pieces from left to right
        if t == "(":  # an opening bracket
            ops.append(t)  # park it on the stack
        elif t == ")":  # a closing bracket
            while length(ops) > 0 and ops[-1] != "(":  # until we reach the matching "("
                out.append(ops.pop())  # move the waiting operators to the output
            if length(ops) == 0:  # we never found the "("
                raise ValueError("Mismatched parentheses.")  # the brackets do not pair up
            ops.pop()  # throw the "(" away
        elif t in PREC:  # an operator
            while length(ops) > 0 and ops[-1] != "(" and (  # operators on the stack may need to go first
                    PREC[ops[-1]] > PREC[t] or  # the stacked one binds more strongly
                    (PREC[ops[-1]] == PREC[t] and not contains(RIGHT, t))):  # equal strength and we group left
                out.append(ops.pop())  # so move it to the output first
            ops.append(t)  # now park the new operator
        else:  # an operand such as A or 12
            out.append(t)  # operands go straight to the output
    while length(ops) > 0:  # the input is finished, empty the stack
        if ops[-1] == "(":  # a bracket that was never closed
            raise ValueError("Mismatched parentheses.")  # the brackets do not pair up
        out.append(ops.pop())  # move the operator to the output
    return out  # the postfix pieces


def build(postfix_tokens):  # turn postfix pieces into a tree using a stack of finished subtrees
    stack = []  # finished subtrees waiting to be combined
    for t in postfix_tokens:  # read the pieces in order
        node = Node(t)  # a new node for this piece
        if t in PREC:  # an operator needs two operands
            if length(stack) < 2:  # not enough operands are waiting
                raise ValueError("An operator is missing an operand.")  # report it
            node.r = stack.pop()  # the most recent subtree becomes the right child
            node.l = stack.pop()  # the one before it becomes the left child
        stack.append(node)  # the new subtree waits for its own parent
    if length(stack) != 1:  # a proper expression leaves exactly one tree
        raise ValueError("An operand is missing an operator.")  # report it
    return stack[0]  # the root of the finished tree


def parse(text):  # the whole pipeline: text -> pieces -> postfix -> tree
    return build(to_postfix(tokenize(text)))  # run the three steps one after the other


def prefix(n):  # preorder: root, then left subtree, then right subtree
    if n is None:  # an empty spot has nothing to visit
        return []  # so it contributes nothing
    return [n.v] + prefix(n.l) + prefix(n.r)  # this node first, then everything on the left, then on the right


def postfix(n):  # postorder: left subtree, then right subtree, then root
    if n is None:  # an empty spot has nothing to visit
        return []  # so it contributes nothing
    return postfix(n.l) + postfix(n.r) + [n.v]  # everything on the left, then on the right, then this node


def infix(n):  # inorder: left subtree, then root, then right subtree (with brackets)
    if n.l is None:  # a leaf (operand) has no children
        return n.v  # it is just its own value
    return "(" + infix(n.l) + n.v + infix(n.r) + ")"  # left, this operator, right, wrapped in brackets


def to_dict(root):  # a plain nested dictionary the web page can draw
    counters = {"pre": 1, "ino": 1, "post": 1}  # the next visit number for each traversal

    def go(n):  # visit one node and everything below it
        if n is None:  # an empty spot
            return None  # nothing to draw
        pre = counters["pre"]  # preorder: this node is visited before its children
        counters["pre"] = pre + 1  # the next node gets the next number
        left = go(n.l)  # visit the whole left subtree
        ino = counters["ino"]  # inorder: this node is visited between its two subtrees
        counters["ino"] = ino + 1  # the next node gets the next number
        right = go(n.r)  # visit the whole right subtree
        post = counters["post"]  # postorder: this node is visited after its children
        counters["post"] = post + 1  # the next node gets the next number
        return {"v": n.v, "x": ino - 1, "pre": pre, "ino": ino, "post": post, "l": left, "r": right}  # x = horizontal slot for drawing

    return go(root)  # start at the root


def analyze(text):  # everything the Binary Tree tab shows for one typed expression
    root = parse(text)  # build the tree (raises ValueError if the text is malformed)
    return {  # the full answer for the page
        "tree": to_dict(root),  # the drawing data with visit numbers
        "prefix": join(prefix(root), " "),  # preorder as text, e.g. "- + A / B D E"
        "infix": infix(root),  # inorder as text
        "postfix": join(postfix(root), " "),  # postorder as text
    }
