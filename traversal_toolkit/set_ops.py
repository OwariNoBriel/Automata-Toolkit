"""Set operations written by hand. A set is a plain list that never holds the same item twice."""  # what this file is for
from .basics import contains, join, length, merge_sort, take  # our own helpers instead of built-in shortcuts

POWER_LIMIT = 10  # list the power set only up to 10 elements (2^10 = 1024 subsets)
PRODUCT_LIMIT = 200  # list a Cartesian product only up to 200 pairs


def _is_space(ch):  # is this character blank space?
    return ch == " " or ch == "\t" or ch == "\n" or ch == "\r"  # space, tab or line break


def add_unique(items, value):  # put value in the set, but only if it is not already there
    if not contains(items, value):  # a set never repeats an element
        items.append(value)  # so only add it when it is new


def parse_set(text):  # turn typed text such as "1, 2 3" into a set
    items = []  # the set starts empty
    word = ""  # the element we are currently reading
    for ch in text:  # read the text one character at a time
        if ch == "," or _is_space(ch):  # commas and blanks separate elements
            if word != "":  # we just finished reading an element
                add_unique(items, word)  # store it (duplicates are ignored)
                word = ""  # start reading the next element
        else:  # any other character belongs to the current element
            word = word + ch  # add it to the element
    if word != "":  # the text ended while an element was still being read
        add_unique(items, word)  # store that last element too
    return items  # the finished set


def _is_number(text):  # does the text consist only of the digits 0 to 9?
    if text == "":  # empty text is not a number
        return False  # so say no
    for ch in text:  # check every character
        if ch < "0" or ch > "9":  # this character is not a digit
            return False  # so the text is not a number
    return True  # every character was a digit


def _to_number(text):  # turn digit text such as "42" into the number 42
    number = 0  # the value built so far
    for ch in text:  # go through the digits from left to right
        number = number * 10 + (ord(ch) - ord("0"))  # shift the old digits left and add this one
    return number  # the finished number


def _comes_before(x, y):  # ordering rule used only to display sets neatly
    if _is_number(x) and _is_number(y):  # two numbers
        return _to_number(x) < _to_number(y)  # compare them as numbers, so 2 comes before 10
    return x < y  # anything else is compared letter by letter


def sort_items(items):  # display order for a set (sets themselves have no order)
    return merge_sort(items, _comes_before)  # our own merge sort with the rule above


def format_set(items):  # write a set the way mathematicians do: {1, 2, 3}
    return "{" + join(sort_items(items), ", ") + "}"  # braces around the sorted elements


def union(a, b):  # A ∪ B: everything that is in A or in B
    result = []  # the answer starts empty
    for x in a:  # take every element of A
        add_unique(result, x)  # and put it in the answer
    for x in b:  # take every element of B
        add_unique(result, x)  # and put it in too (elements already there are skipped)
    return result  # the finished union


def intersection(a, b):  # A ∩ B: only what is in both A and B
    result = []  # the answer starts empty
    for x in a:  # check every element of A
        if contains(b, x):  # is it also in B?
            result.append(x)  # then it belongs to the intersection
    return result  # the finished intersection


def difference(a, b):  # A − B: what is in A but not in B
    result = []  # the answer starts empty
    for x in a:  # check every element of A
        if not contains(b, x):  # is it missing from B?
            result.append(x)  # then it belongs to the difference
    return result  # the finished difference


def symmetric_difference(a, b):  # A Δ B: in exactly one of the two sets
    return union(difference(a, b), difference(b, a))  # (A − B) ∪ (B − A), straight from the definition


def is_subset(a, b):  # A ⊆ B: every element of A is also in B
    for x in a:  # check every element of A
        if not contains(b, x):  # found one that B does not have
            return False  # so A is not a subset of B
    return True  # every element was found in B


def is_superset(a, b):  # A ⊇ B: A contains all of B
    return is_subset(b, a)  # that is the same as B being a subset of A


def is_disjoint(a, b):  # A and B share no elements
    return length(intersection(a, b)) == 0  # nothing in common means the intersection is empty


def power_set(items):  # P(A): every possible subset, including the empty set and A itself
    ordered = sort_items(items)  # use a steady element order
    subsets = [[]]  # start with just the empty subset
    for x in ordered:  # bring in the elements one at a time
        bigger = []  # copies of the existing subsets with x added
        for subset in subsets:  # every subset we have so far
            with_x = take(subset, 0, length(subset))  # copy it
            with_x.append(x)  # and add the new element x
            bigger.append(with_x)  # keep the new subset
        for subset in bigger:  # now the subset count has doubled
            subsets.append(subset)  # add the new subsets to the list
    by_size = []  # the subsets grouped by how many elements they have
    for size in range(length(ordered) + 1):  # sizes 0, 1, 2 ... up to all elements
        by_size.append([])  # one empty group per size
    for subset in subsets:  # sort every subset into its group
        by_size[length(subset)].append(subset)  # the group number is the subset's size
    result = []  # smallest subsets first
    for group in by_size:  # go through the groups in order of size
        for subset in group:  # and every subset inside the group
            result.append(subset)  # add it to the final list
    return result  # the finished power set


def cartesian_product(a, b):  # A × B: every ordered pair (x, y) with x from A and y from B
    pairs = []  # the answer starts empty
    for x in sort_items(a):  # take each element of A in turn
        for y in sort_items(b):  # pair it with each element of B
            pairs.append([x, y])  # keep the ordered pair (x, y)
    return pairs  # the finished product


def _product_info(left_name, right_name, left, right):  # package one Cartesian product for the page
    total = length(left) * length(right)  # |A × B| = |A| · |B|
    pairs = None  # too many pairs are not listed
    if total <= PRODUCT_LIMIT:  # small enough to show on screen
        pairs = cartesian_product(left, right)  # list every ordered pair
    return {"name": left_name + " × " + right_name, "count": total, "pairs": pairs, "limit": PRODUCT_LIMIT}  # what the page needs


def _power_info(name, items):  # package one power set for the page
    n = length(items)  # how many elements the set has
    count = None  # huge counts are sent as None, the page shows 2^n instead
    if n <= 30:  # small enough to write out as a normal number
        count = 1  # 2^0 = 1
        for _ in range(n):  # multiply by 2 once for every element
            count = count * 2  # each new element doubles the number of subsets
    subsets = None  # large power sets are not listed
    if n <= POWER_LIMIT:  # small enough to show on screen
        subsets = power_set(items)  # list every subset
    return {"name": name, "n": n, "count": count, "subsets": subsets, "limit": POWER_LIMIT}  # what the page needs


def analyze(a_text, b_text):  # everything the Sets tab shows, for two typed sets
    a = parse_set(a_text)  # read set A
    b = parse_set(b_text)  # read set B
    if length(a) == 0 and length(b) == 0:  # nothing was typed
        return {"empty": True}  # tell the page to show its hint
    table = [  # one row per operation: [label, answer]
        ["Set A", format_set(a)],  # show A
        ["Set B", format_set(b)],  # show B
        ["Union (A ∪ B)", format_set(union(a, b))],  # everything in either set
        ["Intersection (A ∩ B)", format_set(intersection(a, b))],  # only what both share
        ["Difference (A − B)", format_set(difference(a, b))],  # in A but not B
        ["Difference (B − A)", format_set(difference(b, a))],  # in B but not A
        ["Symmetric difference (A Δ B)", format_set(symmetric_difference(a, b))],  # in exactly one
        ["A ⊆ B", is_subset(a, b)],  # is A inside B?
        ["A ⊇ B", is_superset(a, b)],  # does A contain B?
        ["Disjoint", is_disjoint(a, b)],  # do they share nothing?
        ["|A| / |B|", str(length(a)) + " / " + str(length(b))],  # the sizes (cardinalities)
    ]
    return {  # the full answer for the page
        "empty": False,  # there is something to show
        "table": table,  # the operation rows
        "products": [_product_info("A", "B", a, b), _product_info("B", "A", b, a)],  # A × B and B × A
        "powers": [_power_info("A", a), _power_info("B", b)],  # P(A) and P(B)
    }
