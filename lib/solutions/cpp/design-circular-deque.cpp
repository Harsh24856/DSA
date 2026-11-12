class MyCircularDeque {
    vector<int> a;
    int k, head = 0, size = 0;
public:
    MyCircularDeque(int k) : a(k), k(k) {}

    bool insertFront(int value) {
        if (size == k) return false;
        head = (head - 1 + k) % k;   // step back, wrapping round
        a[head] = value;
        size++;
        return true;
    }

    bool insertLast(int value) {
        if (size == k) return false;
        a[(head + size) % k] = value;
        size++;
        return true;
    }

    bool deleteFront() {
        if (!size) return false;
        head = (head + 1) % k;
        size--;
        return true;
    }

    bool deleteLast() {
        if (!size) return false;
        size--;
        return true;
    }

    int getFront() { return size ? a[head] : -1; }
    int getRear() { return size ? a[(head + size - 1) % k] : -1; }
    bool isEmpty() { return size == 0; }
    bool isFull() { return size == k; }
};
// @test
    MyCircularDeque d(3);
    H::check(d.insertLast(1), true, "insertLast 1");
    H::check(d.insertLast(2), true, "insertLast 2");
    H::check(d.insertFront(3), true, "insertFront 3");
    H::check(d.insertFront(4), false, "insertFront 4 full");
    H::check(d.getRear(), 2, "getRear");
    H::check(d.isFull(), true, "isFull");
    H::check(d.deleteLast(), true, "deleteLast");
    H::check(d.insertFront(4), true, "insertFront 4");
    H::check(d.getFront(), 4, "getFront");
    MyCircularDeque e(1);
    H::check(e.getFront(), -1, "empty getFront");
    H::check(e.deleteFront(), false, "empty deleteFront");
    H::check(e.isEmpty(), true, "isEmpty");
