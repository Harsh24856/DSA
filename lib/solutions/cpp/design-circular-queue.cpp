class MyCircularQueue {
    vector<int> a;
    int head = 0, size = 0;              // index of the front value, number of values
public:
    MyCircularQueue(int k) : a(k) {}

    bool enQueue(int value) {
        if (isFull()) return false;
        a[(head + size) % a.size()] = value;
        size++;
        return true;
    }

    bool deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % a.size();
        size--;
        return true;
    }

    int Front() { return isEmpty() ? -1 : a[head]; }
    int Rear() { return isEmpty() ? -1 : a[(head + size - 1) % a.size()]; }
    bool isEmpty() { return size == 0; }
    bool isFull() { return size == (int)a.size(); }
};
// @test
    MyCircularQueue q(3);
    H::check(q.enQueue(1), true, "enQueue 1");
    H::check(q.enQueue(2), true, "enQueue 2");
    H::check(q.enQueue(3), true, "enQueue 3");
    H::check(q.enQueue(4), false, "enQueue full");
    H::check(q.Rear(), 3, "Rear");
    H::check(q.isFull(), true, "isFull");
    H::check(q.deQueue(), true, "deQueue");
    H::check(q.enQueue(4), true, "enQueue wraps");
    H::check(q.Rear(), 4, "Rear after wrap");
    MyCircularQueue e(1);
    H::check(e.Front(), -1, "empty Front");
    H::check(e.Rear(), -1, "empty Rear");
    H::check(e.deQueue(), false, "empty deQueue");
    H::check(e.enQueue(5), true, "enQueue 5");
    H::check(e.Front(), 5, "Front");
    H::check(e.isFull(), true, "full of one");
