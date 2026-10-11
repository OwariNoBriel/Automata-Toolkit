"""Additional string operations for prefix, suffix, reversal, and palindrome checks."""


def _prefix(s, n=3):
    return s[:n] if s else ""


def _suffix(s, n=3):
    return s[-n:] if s else ""


def _is_palindrome(s):
    """Check if string is palindrome (ignore spaces and case). Needs 2+ characters."""
    clean = s.lower().replace(" ", "")
    return len(clean) > 1 and clean == clean[::-1]


def string_extra_ops(a, b):
    """Return prefix/suffix/reversal/palindrome operations for strings A and B."""
    return [
        ("Prefix of A", _prefix(a)),
        ("Suffix of A", _suffix(a)),
        ("Reverse of A", a[::-1]),
        ("A is a palindrome", _is_palindrome(a)),
        ("Prefix of B", _prefix(b)),
        ("Suffix of B", _suffix(b)),
        ("Reverse of B", b[::-1]),
        ("B is a palindrome", _is_palindrome(b)),
    ]
