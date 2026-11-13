# Example cases for lib/solutions/must/heap.ts, merged into solutions_test.py.
CASES = {
 "ipo": [("findMaximizedCapital", (2, 0, [1,2,3], [0,1,1]), 4), ("findMaximizedCapital", (3, 0, [1,2,3], [0,1,2]), 6), ("findMaximizedCapital", (1, 0, [5], [1]), 0), ("findMaximizedCapital", (10, 0, [1,2], [0,0]), 3)],
 "single-threaded-cpu": [("getOrder", ([[1,2],[2,4],[3,2],[4,1]],), [0,2,3,1]), ("getOrder", ([[7,10],[7,12],[7,5],[7,4],[7,2]],), [4,3,2,0,1]), ("getOrder", ([[5,2]],), [0]), ("getOrder", ([[1,1],[10,1]],), [0,1])],
 "remove-stones-to-minimize-the-total": [("minStoneSum", ([5,4,9], 2), 12), ("minStoneSum", ([4,3,6,7], 3), 12), ("minStoneSum", ([1], 5), 1), ("minStoneSum", ([10000], 1), 5000)],
}
TREE = {}

def _ops_hp(obj, calls):
    return [getattr(obj, name)(*args) for name, args in calls]

def _designs_hp(load, check, h):
    m = load("seat-reservation-manager")["SeatManager"](5)
    check("SeatManager", _ops_hp(m, [("reserve",()),("reserve",()),("unreserve",(2,)),("reserve",()),("reserve",()),("reserve",()),("reserve",()),("unreserve",(5,))]), [1,2,None,2,3,4,5,None])
    m = load("seat-reservation-manager")["SeatManager"](3)
    check("SeatManager order", _ops_hp(m, [("reserve",()),("reserve",()),("reserve",()),("unreserve",(3,)),("unreserve",(1,)),("reserve",()),("reserve",())]), [1,2,3,None,None,1,3])

CUSTOM = [_designs_hp]
