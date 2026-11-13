# Example cases for lib/solutions/must/binary-tree.ts, merged into solutions_test.py.
CASES = {}
TREE = {
 "count-good-nodes-in-binary-tree": [("goodNodes", ([3,1,4,3,None,1,5],), 4, None), ("goodNodes", ([3,3,None,4,2],), 3, None), ("goodNodes", ([1],), 1, None), ("goodNodes", ([2,None,4,10,8,None,None,4],), 4, None)],
 "sum-root-to-leaf-numbers": [("sumNumbers", ([1,2,3],), 25, None), ("sumNumbers", ([4,9,0,5,1],), 1026, None), ("sumNumbers", ([0],), 0, None), ("sumNumbers", ([1,0],), 10, None)],
 "check-completeness-of-a-binary-tree": [("isCompleteTree", ([1,2,3,4,5,6],), True, None), ("isCompleteTree", ([1,2,3,4,5,None,7],), False, None), ("isCompleteTree", ([1],), True, None), ("isCompleteTree", ([1,None,2],), False, None), ("isCompleteTree", ([1,2,3,4],), True, None)],
 "range-sum-of-bst": [("rangeSumBST", ([10,5,15,3,7,None,18], 7, 15), 32, None), ("rangeSumBST", ([10,5,15,3,7,13,18,1,None,6], 6, 10), 23, None), ("rangeSumBST", ([5], 1, 4), 0, None)],
}
CUSTOM = []
