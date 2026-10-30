# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {}
TREE = {}
CUSTOM = []
