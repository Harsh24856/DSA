class MyQueue {
    stack<int> in, out;                                  // push onto in, pop from out

    void move() {                                        // refill out only when it is empty
        if (out.empty())
            while (!in.empty()) { out.push(in.top()); in.pop(); }
    }

public:
    MyQueue() {}

    void push(int x) { in.push(x); }

    int pop() {
        move();
        int x = out.top();
        out.pop();
        return x;
    }

    int peek() {
        move();
        return out.top();
    }

    bool empty() { return in.empty() && out.empty(); }
};
// @test
    MyQueue q;
    q.push(1); q.push(2);
    H::check(q.peek(), 1, "MyQueue peek");
    H::check(q.pop(), 1, "MyQueue pop 1");
    H::check(q.empty(), false, "MyQueue empty 1");
    H::check(q.pop(), 2, "MyQueue pop 2");
    H::check(q.empty(), true, "MyQueue empty 2");
