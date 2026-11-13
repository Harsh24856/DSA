class MyStack {
    queue<int> q;                        // kept newest first
public:
    MyStack() {}

    void push(int x) {
        q.push(x);
        for (int i = 0; i + 1 < (int)q.size(); i++) {   // rotate the older values behind x
            q.push(q.front());
            q.pop();
        }
    }

    int pop() {
        int x = q.front();
        q.pop();
        return x;
    }

    int top() { return q.front(); }
    bool empty() { return q.empty(); }
};
// @test
    MyStack s;
    s.push(1); s.push(2);
    H::check(s.top(), 2, "top");
    H::check(s.pop(), 2, "pop");
    H::check(s.empty(), false, "not empty");
    MyStack t;
    t.push(1); t.push(2); t.push(3);
    H::check(t.pop(), 3, "pop 3");
    t.push(4);
    H::check(t.pop(), 4, "pop 4");
    H::check(t.pop(), 2, "pop 2");
    H::check(t.top(), 1, "top 1");
    H::check(t.pop(), 1, "pop 1");
    H::check(t.empty(), true, "empty");
