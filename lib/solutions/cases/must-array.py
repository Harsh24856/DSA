# Example cases for lib/solutions/must/array.ts, merged into solutions_test.py.
CASES = {
 "remove-duplicates-from-sorted-array": [("removeDuplicates", ([1,1,2],), 2), ("removeDuplicates", ([0,0,1,1,1,2,2,3,3,4],), 5), ("removeDuplicates", ([7],), 1)],
}
TREE = {}

def _must_array(load, check, h):
    g = load("merge-sorted-array")
    for a, m, b, n, exp in [([1,2,3,0,0,0], 3, [2,5,6], 3, [1,2,2,3,5,6]), ([1], 1, [], 0, [1]), ([0], 0, [1], 1, [1]), ([4,5,6,0,0,0], 3, [1,2,3], 3, [1,2,3,4,5,6])]:
        g["merge"](a, m, b, n); check("merge", a, exp)
    g = load("remove-duplicates-from-sorted-array")
    a = [0,0,1,1,1,2,2,3,3,4]; k = g["removeDuplicates"](a); check("removeDuplicates prefix", a[:k], [0,1,2,3,4])
    hm = load("design-hashmap")["MyHashMap"]()
    check("MyHashMap", [hm.put(1,1), hm.put(2,2), hm.get(1), hm.get(3), hm.put(2,1), hm.get(2), hm.remove(2), hm.get(2)], [None,None,1,-1,None,1,None,-1])
    hm = load("design-hashmap")["MyHashMap"]()
    for k in range(0, 1000000, 997): hm.put(k, k + 1)
    check("MyHashMap many", (hm.get(997 * 500), hm.get(5), hm.get(0)), (997 * 500 + 1, -1, 1))
    rs = load("insert-delete-getrandom-o1")["RandomizedSet"]()
    check("RandomizedSet", [rs.insert(1), rs.remove(2), rs.insert(2), rs.getRandom() in (1, 2), rs.remove(1), rs.insert(2), rs.getRandom()], [True, False, True, True, True, False, 2])
    rs = load("insert-delete-getrandom-o1")["RandomizedSet"]()
    for x in range(10): rs.insert(x)
    for x in range(0, 10, 2): rs.remove(x)
    check("RandomizedSet spread", {rs.getRandom() for _ in range(300)}, {1, 3, 5, 7, 9})

CUSTOM = [_must_array]
