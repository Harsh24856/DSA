// Binary min-heap in a vector: parent of i is (i - 1) / 2, children are 2i + 1 and 2i + 2
class MinHeap {
    vector<int> a;

    void up(int i) {                          // move a[i] up while it is smaller than its parent
        while (i > 0) {
            int p = (i - 1) / 2;
            if (a[p] <= a[i]) break;
            swap(a[p], a[i]);
            i = p;
        }
    }

    void down(int i) {                        // move a[i] down, swapping with the smaller child
        int n = a.size();
        while (true) {
            int small = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && a[l] < a[small]) small = l;
            if (r < n && a[r] < a[small]) small = r;
            if (small == i) return;
            swap(a[i], a[small]);
            i = small;
        }
    }

public:
    MinHeap() = default;
    explicit MinHeap(vector<int> items) : a(std::move(items)) {   // heapify, O(n)
        for (int i = (int)a.size() / 2 - 1; i >= 0; i--) down(i);
    }

    void push(int x) { a.push_back(x); up(a.size() - 1); }       // O(log n)
    int top() const { if (a.empty()) throw out_of_range("empty heap"); return a[0]; }   // O(1)
    int pop() {                                                   // O(log n)
        if (a.empty()) throw out_of_range("pop from empty heap");
        int t = a[0];
        a[0] = a.back();                      // last leaf to the root keeps the tree complete
        a.pop_back();
        if (!a.empty()) down(0);
        return t;
    }
    int replace(int x) {                      // pop then push with one sift
        int t = top();
        a[0] = x;
        down(0);
        return t;
    }
    int size() const { return a.size(); }
    bool empty() const { return a.empty(); }
};

// In place, ascending: build a MAX-heap, then swap the root to the end and shrink the heap
void heapSort(vector<int>& a) {
    auto down = [&](int i, int n) {
        while (true) {
            int big = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && a[l] > a[big]) big = l;
            if (r < n && a[r] > a[big]) big = r;
            if (big == i) return;
            swap(a[i], a[big]);
            i = big;
        }
    };
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--) down(i, n);   // heapify, O(n)
    for (int end = n - 1; end > 0; end--) {
        swap(a[0], a[end]);                            // the largest goes to its final place
        down(0, end);
    }
}
// @test
    MinHeap h;
    for (int x : {5, 3, 8, 1, 4, 2}) h.push(x);
    H::check(h.top(), 1, "top");
    H::check(h.size(), 6, "size");
    vector<int> got;
    while (!h.empty()) got.push_back(h.pop());
    H::check(got, vector<int>{1, 2, 3, 4, 5, 8}, "pops in order");
    MinHeap g({9, 4, 7, 1, 8, 2, 6});
    H::check(g.replace(5), 1, "replace returns the old min");
    H::check(g.top(), 2, "new min");
    got.clear();
    while (!g.empty()) got.push_back(g.pop());
    H::check(got, vector<int>{2, 4, 5, 6, 7, 8, 9}, "heapify then pop");
    bool threw = false;
    try { g.pop(); } catch (const out_of_range&) { threw = true; }
    H::check(threw, true, "pop empty throws");
    vector<int> v = {5, -1, 3, 3, 0, 9, 2};
    heapSort(v);
    H::check(v, vector<int>{-1, 0, 2, 3, 3, 5, 9}, "heap sort");
    vector<int> e;
    heapSort(e);
    H::check(e, vector<int>{}, "heap sort empty");
    unsigned seed = 7;
    for (int t = 0; t < 50; t++) {
        vector<int> r;
        for (int k = 0; k < t; k++) { seed = seed * 1103515245 + 12345; r.push_back((int)(seed >> 16) % 100); }
        vector<int> s = r;
        heapSort(s);
        MinHeap m(r);
        vector<int> out;
        while (!m.empty()) out.push_back(m.pop());
        H::check(s == H::sorted(r) && out == H::sorted(r), true, "random " + to_string(t));
    }
