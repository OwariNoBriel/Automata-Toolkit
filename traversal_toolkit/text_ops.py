"""Text operations written by hand: every operation is done character by character."""  # what this file is for
from .basics import contains, length  # our own helpers instead of built-in shortcuts


def _is_space(ch):  # is this character blank space?
    return ch == " " or ch == "\t" or ch == "\n" or ch == "\r"  # space, tab or line break


def concatenate(a, b):  # A + B: write A, then write B right after it
    result = ""  # the answer starts empty
    for ch in a:  # copy every character of A
        result = result + ch  # add it to the end of the answer
    for ch in b:  # then copy every character of B
        result = result + ch  # add it to the end of the answer
    return result  # the joined text


def reverse(text):  # read the text from the last character back to the first
    result = ""  # the answer starts empty
    index = length(text) - 1  # begin at the last position
    while index >= 0:  # keep going until we pass the first position
        result = result + text[index]  # add the character at this position
        index -= 1  # step one position to the left
    return result  # the reversed text


def to_upper(text):  # change every small letter into its capital letter
    result = ""  # the answer starts empty
    for ch in text:  # look at every character
        code = ord(ch)  # the character's number in the character table
        if 97 <= code <= 122:  # codes 97 to 122 are the letters a to z
            result = result + chr(code - 32)  # capitals sit exactly 32 places earlier
        else:  # anything else (capitals, digits, symbols)
            result = result + ch  # stays as it is
    return result  # the uppercase text


def to_lower(text):  # change every capital letter into its small letter
    result = ""  # the answer starts empty
    for ch in text:  # look at every character
        code = ord(ch)  # the character's number in the character table
        if 65 <= code <= 90:  # codes 65 to 90 are the letters A to Z
            result = result + chr(code + 32)  # small letters sit exactly 32 places later
        else:  # anything else (small letters, digits, symbols)
            result = result + ch  # stays as it is
    return result  # the lowercase text


def first_chars(text, n):  # the prefix made of the first n characters
    size = length(text)  # how long the text is
    result = ""  # the answer starts empty
    index = 0  # begin at the first position
    while index < n and index < size:  # stop at n characters or at the end of the text
        result = result + text[index]  # copy this character
        index += 1  # move to the next position
    return result  # the first n characters (or fewer if the text is short)


def prefixes(text):  # every progressive prefix: e.g. "gab" -> "g ga gab"
    result = []
    for i in range(1, length(text) + 1):
        result.append(first_chars(text, i))
    return " ".join(result)


def suffixes(text):  # every progressive suffix: e.g. "gab" -> "b ab gab"
    result = []
    for i in range(length(text) - 1, -1, -1):
        result.append(last_chars(text, length(text) - i))
    return " ".join(result)

def last_chars(text, n):  # the suffix made of the last n characters
    size = length(text)  # how long the text is
    index = size - n  # the position where the suffix starts
    if index < 0:  # the text is shorter than n
        index = 0  # so take all of it
    result = ""  # the answer starts empty
    while index < size:  # copy up to the end of the text
        result = result + text[index]  # copy this character
        index += 1  # move to the next position
    return result  # the last n characters (or fewer if the text is short)


def starts_with(text, prefix):  # does the text begin with this prefix?
    prefix_size = length(prefix)  # how long the prefix is
    if prefix_size > length(text):  # the prefix is longer than the whole text
        return False  # so it cannot fit at the start
    for i in range(prefix_size):  # compare position by position
        if text[i] != prefix[i]:  # a character differs
            return False  # so the text does not start with the prefix
    return True  # every character matched


def ends_with(text, suffix):  # does the text end with this suffix?
    suffix_size = length(suffix)  # how long the suffix is
    offset = length(text) - suffix_size  # where the suffix would have to begin
    if offset < 0:  # the suffix is longer than the whole text
        return False  # so it cannot fit at the end
    for i in range(suffix_size):  # compare position by position
        if text[offset + i] != suffix[i]:  # a character differs
            return False  # so the text does not end with the suffix
    return True  # every character matched


def unique_count(text):  # how many different characters the text uses
    seen = []  # the characters met so far
    for ch in text:  # look at every character
        if not contains(seen, ch):  # have we met it before?
            seen.append(ch)  # no, so remember it
    return length(seen)  # the number of different characters


def _squash(text):  # for the palindrome test: drop blanks and ignore capitals
    result = ""  # the answer starts empty
    for ch in to_lower(text):  # go through the lowercase version
        if not _is_space(ch):  # skip spaces, tabs and line breaks
            result = result + ch  # keep everything else
    return result  # the cleaned-up text


def is_palindrome(text):  # does it read the same forwards and backwards? (needs 2+ characters)
    clean = _squash(text)  # ignore spaces and letter case
    last = length(clean) - 1  # position of the last character
    if last < 1:  # fewer than 2 characters
        return False  # one character on its own does not count
    left = 0  # a finger at the first character
    right = last  # a finger at the last character
    while left < right:  # work towards the middle
        if clean[left] != clean[right]:  # the two ends do not match
            return False  # so it is not a palindrome
        left += 1  # move the left finger inward
        right -= 1  # move the right finger inward
    return True  # every pair matched


def _palindrome_answer(text):  # what the page shows in the "Is palindrome" row
    if length(_squash(text)) == 0:  # there is no text to test
        return "No text"  # say so instead of Yes or No
    return is_palindrome(text)  # otherwise a plain True or False


def _rows_for(text, prefix, suffix):  # the operation rows for one text
    rows = [  # one row per operation: [label, answer]
        ["Prefixes", prefixes(text)],
        ["Suffixes", suffixes(text)],
        ["Reversed", reverse(text)],  # backwards
        ["Is palindrome", _palindrome_answer(text)],  # same both ways?
        ["Uppercase", to_upper(text)],  # all capitals
        ["Lowercase", to_lower(text)],  # all small letters
        ["First 3 chars", first_chars(text, 3)],  # a fixed prefix of 3
        ["Last 3 chars", last_chars(text, 3)],  # a fixed suffix of 3
        ["Unique chars", unique_count(text)],  # different characters used
    ]
    if prefix != "":  # the user typed a custom prefix
        rows.append(['Starts with "' + prefix + '"', starts_with(text, prefix)])  # does the text start with it?
    if suffix != "":  # the user typed a custom suffix
        rows.append(['Ends with "' + suffix + '"', ends_with(text, suffix)])  # does the text end with it?
    return rows  # the finished rows


def analyze(a, b, prefix="", suffix=""):  # everything the Text tab shows, for two typed texts
    if a == "" and b == "":  # nothing was typed
        return {"empty": True}  # tell the page to show nothing
    return {  # the full answer for the page
        "empty": False,  # there is something to show
        "combined": [  # rows that involve both texts
            ["Text A", a],  # show A
            ["Text B", b],  # show B
            ["Concatenation (A + B)", concatenate(a, b)],  # A followed by B
            ["Length A / B", str(length(a)) + " / " + str(length(b))],  # how many characters each has
        ],
        "a": _rows_for(a, prefix, suffix),  # operations on text A
        "b": _rows_for(b, prefix, suffix),  # operations on text B
    }


def string_ops(a, b, sub=""):
    sub = sub or first_chars(a, 1)
    return [
        ("A", a),
        ("B", b),
        ("Prefixes of A", prefixes(a)),
        ("Suffixes of A", suffixes(a)),
        ("Prefixes of B", prefixes(b)),
        ("Suffixes of B", suffixes(b)),
        ("Concatenation (A + B)", concatenate(a, b)),
        ("Length of A / B", f"{length(a)} / {length(b)}"),
        ("Reverse of A", reverse(a)),
        ("Uppercase A", to_upper(a)),
        ("Lowercase A", to_lower(a)),
        ("Slice A[0:3]", first_chars(a, 3)),
        ("A == B", a == b),
        ("A is a palindrome", is_palindrome(a)),
        ("A starts with B[0]", starts_with(a, first_chars(b, 1))),
    ]
