class NumArray {
    int n;
    vector<int> a;
    vector<int> t;   // Fenwick tree, 1-indexed

    void add(int i, int d) {
        for (; i <= n; i += i & -i) t[i] += d;
    }
    int prefix(int i) {
        int s = 0;
        for (; i; i -= i & -i) s += t[i];
        return s;
    }

public:
    NumArray(vector<int>& nums) : n(nums.size()), a(nums), t(n + 1, 0) {
        for (int i = 0; i < n; i++) add(i + 1, nums[i]);
    }

    void update(int index, int val) {
        add(index + 1, val - a[index]);   // push only the change
        a[index] = val;
    }

    int sumRange(int left, int right) {
        return prefix(right + 1) - prefix(left);
    }
};
// @test
    vector<int> v1{1, 3, 5};
    NumArray na(v1);
    H::check(na.sumRange(0, 2), 9, "sum a1");
    na.update(1, 2);
    H::check(na.sumRange(0, 2), 8, "sum a2");
    vector<int> v2{7, 2, 7, 2, 0};
    NumArray nb(v2);
    nb.update(4, 6); nb.update(0, 2); nb.update(0, 9);
    H::check(vector<int>{nb.sumRange(4, 4), nb.sumRange(0, 4), nb.sumRange(1, 3)}, vector<int>{6, 26, 11}, "NumArray b");
