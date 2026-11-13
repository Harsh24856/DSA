// Singly linked list with a sentinel (dummy) head, a tail pointer and a size
class LinkedList {
    struct Node { int val; Node* next; };
    Node dummy{0, nullptr};      // never holds data; dummy.next is the real head
    Node* tail = &dummy;         // last node, so append is O(1)
    int n = 0;

    Node* before(int i) {        // node just before position i, O(i)
        Node* cur = &dummy;
        while (i--) cur = cur->next;
        return cur;
    }

public:
    LinkedList() = default;
    LinkedList(const LinkedList&) = delete;
    LinkedList& operator=(const LinkedList&) = delete;
    ~LinkedList() { while (n) erase(0); }

    int size() const { return n; }
    int get(int i) { if (i < 0 || i >= n) throw out_of_range("index"); return before(i)->next->val; }

    void insert(int i, int val) {                 // 0 <= i <= size
        if (i < 0 || i > n) throw out_of_range("index");
        Node* prev = i == n ? tail : before(i);
        prev->next = new Node{val, prev->next};   // new node points on first, then prev points at it
        if (prev == tail) tail = prev->next;
        n++;
    }
    void pushFront(int val) { insert(0, val); }
    void append(int val) { insert(n, val); }

    int erase(int i) {                            // remove position i, return its value
        if (i < 0 || i >= n) throw out_of_range("index");
        Node* prev = before(i);
        Node* gone = prev->next;
        prev->next = gone->next;                  // unlink
        if (gone == tail) tail = prev;
        int v = gone->val;
        delete gone;
        n--;
        return v;
    }

    int find(int val) const {                     // index of the first match, or -1
        int i = 0;
        for (Node* cur = dummy.next; cur; cur = cur->next, i++)
            if (cur->val == val) return i;
        return -1;
    }

    void reverse() {                              // flip every next pointer, O(1) extra space
        Node *prev = nullptr, *cur = dummy.next;
        tail = cur ? cur : &dummy;
        while (cur) { Node* nxt = cur->next; cur->next = prev; prev = cur; cur = nxt; }
        dummy.next = prev;
    }

    int back() const { return tail->val; }
    vector<int> toVector() const { vector<int> out; for (Node* c = dummy.next; c; c = c->next) out.push_back(c->val); return out; }
};

// Circular doubly linked list around one sentinel: no null checks anywhere
class DoublyLinkedList {
public:
    struct Node { int val; Node *prev, *next; };
private:
    Node s{0, &s, &s};           // empty list: the sentinel points at itself
public:
    DoublyLinkedList() = default;
    DoublyLinkedList(const DoublyLinkedList&) = delete;
    DoublyLinkedList& operator=(const DoublyLinkedList&) = delete;
    ~DoublyLinkedList() { while (!empty()) popFront(); }

    bool empty() const { return s.next == &s; }
    Node* insertAfter(Node* node, int val) {      // O(1) once you hold the node
        Node* x = new Node{val, node, node->next};
        node->next->prev = x;
        node->next = x;
        return x;
    }
    Node* pushFront(int val) { return insertAfter(&s, val); }
    Node* pushBack(int val) { return insertAfter(s.prev, val); }
    int remove(Node* node) {                      // O(1): both neighbours are one step away
        node->prev->next = node->next;
        node->next->prev = node->prev;
        int v = node->val;
        delete node;
        return v;
    }
    int popFront() { return remove(s.next); }     // callers check empty() first
    int popBack() { return remove(s.prev); }
    vector<int> toVector() const { vector<int> out; for (Node* c = s.next; c != &s; c = c->next) out.push_back(c->val); return out; }
};
// @test
    LinkedList a;
    for (int x : {1, 3, 4}) a.append(x);
    a.insert(1, 2); a.pushFront(0);
    H::check(a.toVector(), vector<int>{0, 1, 2, 3, 4}, "insert and append");
    H::check(a.size(), 5, "size");
    H::check(a.get(3), 3, "get");
    H::check(a.find(4), 4, "find");
    H::check(a.find(9), -1, "find missing");
    H::check(a.erase(4), 4, "erase tail");
    H::check(a.back(), 3, "tail moved back");
    a.append(5);
    H::check(a.toVector(), vector<int>{0, 1, 2, 3, 5}, "append after erase");
    H::check(a.erase(0), 0, "erase head");
    a.reverse();
    H::check(a.toVector(), vector<int>{5, 3, 2, 1}, "reverse");
    H::check(a.back(), 1, "tail after reverse");
    a.append(9);
    H::check(a.toVector(), vector<int>{5, 3, 2, 1, 9}, "append after reverse");
    bool threw = false;
    try { a.get(5); } catch (const out_of_range&) { threw = true; }
    H::check(threw, true, "get out of range");
    LinkedList e; e.reverse(); e.append(7);
    H::check(e.toVector(), vector<int>{7}, "empty reverse then append");
    DoublyLinkedList d;
    auto* n2 = d.pushBack(2); d.pushBack(3); d.pushFront(1);
    H::check(d.toVector(), vector<int>{1, 2, 3}, "doubly push");
    d.insertAfter(n2, 9);
    H::check(d.toVector(), vector<int>{1, 2, 9, 3}, "doubly insertAfter");
    H::check(d.remove(n2), 2, "doubly remove held node");
    H::check(d.popFront(), 1, "doubly popFront");
    H::check(d.popBack(), 3, "doubly popBack");
    H::check(d.toVector(), vector<int>{9}, "doubly left");
    d.popBack();
    H::check(d.empty(), true, "doubly empty");
