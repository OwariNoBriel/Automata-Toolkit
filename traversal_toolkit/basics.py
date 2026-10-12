"""Small hand-written helpers used by the lessons, so no built-in shortcut hides the idea."""  # what this file is for


def length(items):  # count how many items (or characters) there are
    count = 0  # nothing has been counted yet
    for _ in items:  # visit every item exactly once
        count += 1  # add one for each item visited
    return count  # the final tally is the length


def contains(items, target):  # is target one of the items? (the "element of" idea, x ∈ A)
    for item in items:  # look at the items one by one
        if item == target:  # found a match
            return True  # no need to look any further
    return False  # we checked everything and found nothing


def join(words, separator):  # glue pieces of text together with a separator between them
    text = ""  # the text built so far
    first = True  # the first piece does not get a separator in front of it
    for word in words:  # go through the pieces in order
        if not first:  # every piece after the first one
            text = text + separator  # put the separator in front of it
        text = text + word  # add the piece itself
        first = False  # from now on we are past the first piece
    return text  # the finished text


def take(items, start, stop):  # copy the items from position start up to (not including) stop
    part = []  # the copy starts empty
    index = start  # begin at the start position
    while index < stop:  # stop just before the stop position
        part.append(items[index])  # copy one item
        index += 1  # move to the next position
    return part  # the copied piece


def merge_sort(items, less):  # sort by cutting in half, sorting each half, then merging them
    size = length(items)  # how many items we have
    if size <= 1:  # zero or one item is already sorted
        return take(items, 0, size)  # hand back a copy
    middle = size // 2  # where to cut the list in two
    left = merge_sort(take(items, 0, middle), less)  # sort the first half
    right = merge_sort(take(items, middle, size), less)  # sort the second half
    left_size = length(left)  # count once so we do not recount in every loop
    right_size = length(right)  # same for the right half
    merged = []  # the sorted result is built here
    i = 0  # our position in the left half
    j = 0  # our position in the right half
    while i < left_size and j < right_size:  # while both halves still have items
        if less(right[j], left[i]):  # the right item must come first
            merged.append(right[j])  # take the right item
            j += 1  # move on in the right half
        else:  # otherwise the left item comes first (ties keep their order)
            merged.append(left[i])  # take the left item
            i += 1  # move on in the left half
    while i < left_size:  # the left half still has leftovers
        merged.append(left[i])  # they are already in order, so copy them over
        i += 1  # move on in the left half
    while j < right_size:  # the right half still has leftovers
        merged.append(right[j])  # copy them over as well
        j += 1  # move on in the right half
    return merged  # the fully sorted list
