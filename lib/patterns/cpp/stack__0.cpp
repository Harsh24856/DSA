// Stack on a dynamic array: the top is the END of the vector, so push and pop never shift
class ArrayStack {
    vector<int> a;
public:
    void push(int x) { a.push_back(x); }                 // amortised O(1)
    int pop() {
        if (a.empty()) throw out_of_range("pop from empty stack");
        int x = a.back();
        a.pop_back();
        return x;
    }
    int top() const { if (a.empty()) throw out_of_range("empty"); return a.back(); }
    bool empty() const { return a.empty(); }
    int size() const { return a.size(); }
};

// Stack on a singly linked list: the top is the HEAD, O(1) worst case, no resizing
class LinkedStack {
    struct Node { int val; Node* next; };
    Node* head = nullptr;
    int n = 0;
public:
    LinkedStack() = default;
    LinkedStack(const LinkedStack&) = delete;
    LinkedStack& operator=(const LinkedStack&) = delete;
    ~LinkedStack() { while (head) pop(); }
    void push(int x) { head = new Node{x, head}; n++; }
    int pop() {
        if (!head) throw out_of_range("pop from empty stack");
        Node* old = head;
        int x = old->val;
        head = old->next;
        delete old;
        n--;
        return x;
    }
    int top() const { if (!head) throw out_of_range("empty"); return head->val; }
    bool empty() const { return !head; }
    int size() const { return n; }
};

// Queue and deque on a circular buffer: head index + size, indexes wrap with % cap, doubles when full
class RingDeque {
    vector<int> a;
    int head = 0, n = 0;
    int cap() const { return a.size(); }
    void grow() {                                        // copy in queue order into twice the space, O(n)
        vector<int> b(cap() * 2);
        for (int i = 0; i < n; i++) b[i] = a[(head + i) % cap()];
        a.swap(b);
        head = 0;
    }
public:
    explicit RingDeque(int capacity = 4) : a(max(1, capacity)) {}
    void pushBack(int x) {                               // enqueue
        if (n == cap()) grow();
        a[(head + n) % cap()] = x;
        n++;
    }
    void pushFront(int x) {
        if (n == cap()) grow();
        head = (head - 1 + cap()) % cap();               // step back; + cap keeps it non-negative
        a[head] = x;
        n++;
    }
    int popFront() {                                     // dequeue
        if (!n) throw out_of_range("empty");
        int x = a[head];
        head = (head + 1) % cap();
        n--;
        return x;
    }
    int popBack() {
        if (!n) throw out_of_range("empty");
        n--;
        return a[(head + n) % cap()];
    }
    int front() const { return a[head]; }               // callers check empty() first
    int back() const { return a[(head + n - 1) % cap()]; }
    int operator[](int i) const { return a[(head + i) % cap()]; }   // O(1) by index
    bool empty() const { return n == 0; }
    int size() const { return n; }
    int capacity() const { return cap(); }
};

// Queue from two stacks: push onto in; pop from out, refilling it only when it is empty
class TwoStackQueue {
    vector<int> in, out;
    void refill() {
        if (out.empty())
            while (!in.empty()) { out.push_back(in.back()); in.pop_back(); }   // oldest ends on top
    }
public:
    void push(int x) { in.push_back(x); }
    int pop() { refill(); int x = out.back(); out.pop_back(); return x; }   // amortised O(1)
    int peek() { refill(); return out.back(); }
    bool empty() const { return in.empty() && out.empty(); }
};
// @test
    ArrayStack s;
    LinkedStack l;
    for (int x : {1, 2, 3}) { s.push(x); l.push(x); }
    H::check(s.top(), 3, "array top");
    H::check(l.top(), 3, "linked top");
    H::check(s.pop(), 3, "array pop");
    H::check(l.pop(), 3, "linked pop");
    H::check(s.size(), 2, "array size");
    H::check(l.size(), 2, "linked size");
    s.pop(); s.pop(); l.pop(); l.pop();
    H::check(s.empty() && l.empty(), true, "both empty");
    bool threw = false;
    try { l.pop(); } catch (const out_of_range&) { threw = true; }
    H::check(threw, true, "pop empty throws");
    RingDeque d(2);
    d.pushBack(1); d.pushBack(2);
    H::check(d.popFront(), 1, "dequeue");
    d.pushBack(3); d.pushBack(4);
    vector<int> got;
    for (int i = 0; i < d.size(); i++) got.push_back(d[i]);
    H::check(got, vector<int>{2, 3, 4}, "wrap then grow");
    H::check(d.capacity(), 4, "doubled");
    d.pushFront(0); d.pushFront(-1);
    got.clear();
    for (int i = 0; i < d.size(); i++) got.push_back(d[i]);
    H::check(got, vector<int>{-1, 0, 2, 3, 4}, "push front wraps");
    H::check(d.front(), -1, "front");
    H::check(d.back(), 4, "back");
    H::check(d.popBack(), 4, "pop back");
    H::check(d.popFront(), -1, "pop front");
    H::check(d.size(), 3, "size");
    TwoStackQueue q;
    q.push(1); q.push(2);
    H::check(q.peek(), 1, "queue peek");
    H::check(q.pop(), 1, "queue pop 1");
    q.push(3);
    H::check(q.pop(), 2, "queue pop 2");
    H::check(q.pop(), 3, "queue pop 3");
    H::check(q.empty(), true, "queue empty");
