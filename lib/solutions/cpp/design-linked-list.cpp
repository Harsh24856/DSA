class MyLinkedList {
    struct Node { int val; Node* next; };
    Node dummy{0, nullptr};                  // sentinel before the head
    int size = 0;

    Node* before(int index) {                // node just before position index
        Node* cur = &dummy;
        while (index--) cur = cur->next;
        return cur;
    }

public:
    MyLinkedList() {}
    ~MyLinkedList() { while (size) deleteAtIndex(0); }

    int get(int index) {
        if (index < 0 || index >= size) return -1;
        return before(index)->next->val;
    }

    void addAtHead(int val) { addAtIndex(0, val); }
    void addAtTail(int val) { addAtIndex(size, val); }

    void addAtIndex(int index, int val) {
        if (index < 0 || index > size) return;
        Node* prev = before(index);
        prev->next = new Node{val, prev->next};
        size++;
    }

    void deleteAtIndex(int index) {
        if (index < 0 || index >= size) return;
        Node* prev = before(index);
        Node* gone = prev->next;
        prev->next = gone->next;
        delete gone;
        size--;
    }
};
// @test
    MyLinkedList a;
    a.addAtHead(1); a.addAtTail(3); a.addAtIndex(1, 2);
    H::check(a.get(1), 2, "get 1");
    a.deleteAtIndex(1);
    H::check(a.get(1), 3, "get after delete");
    MyLinkedList b;
    b.addAtIndex(1, 0);
    H::check(b.get(0), -1, "index past size ignored");
    b.addAtIndex(0, 10); b.addAtIndex(1, 20); b.deleteAtIndex(5); b.deleteAtIndex(0);
    H::check(b.get(0), 20, "delete head");
    H::check(b.get(1), -1, "get past end");
    b.addAtTail(30);
    H::check(b.get(1), 30, "append");
