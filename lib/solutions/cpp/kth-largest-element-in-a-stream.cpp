class KthLargest {
    int k;
    priority_queue<int, vector<int>, greater<int>> heap;   // the k largest so far; the top is the k-th

public:
    KthLargest(int k, vector<int>& nums) : k(k) {
        for (int x : nums) add(x);
    }

    int add(int val) {
        heap.push(val);
        if ((int)heap.size() > k) heap.pop();            // drop the smallest
        return heap.top();
    }
};
// @test
    vector<int> n1 = {4, 5, 8, 2};
    KthLargest a(3, n1);
    vector<int> got;
    for (int v : {3, 5, 10, 9, 4}) got.push_back(a.add(v));
    H::check(got, vector<int>{4, 5, 5, 8, 8}, "KthLargest a");
    vector<int> n2 = {7, 7, 7, 7, 8, 3};
    KthLargest b(4, n2);
    got.clear();
    for (int v : {2, 10, 9, 9}) got.push_back(b.add(v));
    H::check(got, vector<int>{7, 7, 7, 8}, "KthLargest b");
