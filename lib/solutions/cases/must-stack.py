# Example cases for lib/solutions/must/stack.ts, merged into solutions_test.py.
CASES = {
 "validate-stack-sequences": [("validateStackSequences", ([1,2,3,4,5], [4,5,3,2,1]), True), ("validateStackSequences", ([1,2,3,4,5], [4,3,5,1,2]), False), ("validateStackSequences", ([1], [1]), True), ("validateStackSequences", ([2,1,0], [1,2,0]), True)],
 "remove-all-adjacent-duplicates-in-string": [("removeDuplicates", ("abbaca",), "ca"), ("removeDuplicates", ("azxxzy",), "ay"), ("removeDuplicates", ("aa",), ""), ("removeDuplicates", ("a",), "a")],
}
TREE = {}

def _ops_st(obj, calls):
    return [getattr(obj, name)(*args) for name, args in calls]

def _designs_st(load, check, h):
    s = load("implement-stack-using-queues")["MyStack"]()
    check("MyStack", _ops_st(s, [("push",(1,)),("push",(2,)),("top",()),("pop",()),("empty",())]), [None,None,2,2,False])
    s = load("implement-stack-using-queues")["MyStack"]()
    check("MyStack more", _ops_st(s, [("push",(1,)),("push",(2,)),("push",(3,)),("pop",()),("push",(4,)),("pop",()),("pop",()),("top",()),("pop",()),("empty",())]), [None,None,None,3,None,4,2,1,1,True])
    q = load("design-circular-queue")["MyCircularQueue"](3)
    check("MyCircularQueue", _ops_st(q, [("enQueue",(1,)),("enQueue",(2,)),("enQueue",(3,)),("enQueue",(4,)),("Rear",()),("isFull",()),("deQueue",()),("enQueue",(4,)),("Rear",())]), [True,True,True,False,3,True,True,True,4])
    q = load("design-circular-queue")["MyCircularQueue"](1)
    check("MyCircularQueue empty", _ops_st(q, [("Front",()),("Rear",()),("deQueue",()),("isEmpty",()),("enQueue",(5,)),("Front",()),("isFull",()),("deQueue",()),("isEmpty",())]), [-1,-1,False,True,True,5,True,True,True])
    r = load("number-of-recent-calls")["RecentCounter"]()
    check("RecentCounter", _ops_st(r, [("ping",(1,)),("ping",(100,)),("ping",(3001,)),("ping",(3002,))]), [1,2,3,3])
    r = load("number-of-recent-calls")["RecentCounter"]()
    check("RecentCounter gap", _ops_st(r, [("ping",(642,)),("ping",(1849,)),("ping",(4921,)),("ping",(5936,)),("ping",(5957,))]), [1,2,1,2,3])

CUSTOM = [_designs_st]
