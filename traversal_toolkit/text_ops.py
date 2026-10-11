"""String operators lesson, applied to traversal strings."""


def string_ops(a, b, sub=""):
    sub = sub or a[:1]
    return [
        ("A", a), ("B", b),
        ("Concatenation (A + B)", a + b),
        ("Length of A / B", f"{len(a)} / {len(b)}"),
        ("Reverse of A", a[::-1]),
        ("Uppercase A", a.upper()), ("Lowercase A", a.lower()),
        ("Slice A[0:3]", a[:3]),
        (f"Index of '{sub}' in A", a.find(sub)),
        (f"Count of '{sub}' in A", a.count(sub)),
        (f"Replace '{sub}' with '*' in A", a.replace(sub, "*")),
        ("A == B", a == b),
        ("A is a palindrome", len(a) > 1 and a == a[::-1]),
        ("A starts with B[0]", a.startswith(b[:1])),
    ]
