# Example cases for lib/solutions/must/linkedlist.ts, merged into solutions_test.py.
CASES = {}
TREE = {}

def _ops_ll(obj, calls):
    return [getattr(obj, name)(*args) for name, args in calls]

def _lists_ll(load, check, h):
    f = load("odd-even-linked-list")["oddEvenList"]
    for a, exp in [([1,2,3,4,5], [1,3,5,2,4]), ([2,1,3,5,6,4,7], [2,3,6,7,1,5,4]), ([], []), ([1], [1]), ([1,2], [1,2])]:
        check("oddEvenList " + str(a), h.arr(f(h.lst(a))), exp)
    f = load("rotate-list")["rotateRight"]
    for a, k, exp in [([1,2,3,4,5], 2, [4,5,1,2,3]), ([0,1,2], 4, [2,0,1]), ([], 0, []), ([1], 99, [1]), ([1,2,3], 3, [1,2,3])]:
        check("rotateRight " + str((a, k)), h.arr(f(h.lst(a), k)), exp)
    f = load("remove-linked-list-elements")["removeElements"]
    for a, v, exp in [([1,2,6,3,4,5,6], 6, [1,2,3,4,5]), ([], 1, []), ([7,7,7,7], 7, []), ([1,2,2,1], 2, [1,1])]:
        check("removeElements " + str((a, v)), h.arr(f(h.lst(a), v)), exp)
    f = load("insertion-sort-list")["insertionSortList"]
    for a, exp in [([4,2,1,3], [1,2,3,4]), ([-1,5,3,4,0], [-1,0,3,4,5]), ([1], [1]), ([3,3,1,3], [1,3,3,3])]:
        check("insertionSortList " + str(a), h.arr(f(h.lst(a))), exp)
    L = load("design-linked-list")["MyLinkedList"]
    check("MyLinkedList", _ops_ll(L(), [("addAtHead",(1,)),("addAtTail",(3,)),("addAtIndex",(1,2)),("get",(1,)),("deleteAtIndex",(1,)),("get",(1,))]), [None,None,None,2,None,3])
    check("MyLinkedList bounds", _ops_ll(L(), [("addAtIndex",(1,0)),("get",(0,)),("addAtIndex",(0,10)),("addAtIndex",(1,20)),("deleteAtIndex",(5,)),("deleteAtIndex",(0,)),("get",(0,)),("get",(1,)),("addAtTail",(30,)),("get",(1,))]), [None,-1,None,None,None,None,20,-1,None,30])

CUSTOM = [_lists_ll]
