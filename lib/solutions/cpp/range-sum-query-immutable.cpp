class NumArray {
    vector<int> pre{0};                                    // pre[i] = sum of the first i numbers
public:
    NumArray(vector<int>& nums) {
        for (int x : nums) pre.push_back(pre.back() + x);
    }

    int sumRange(int left, int right) { return pre[right + 1] - pre[left]; }
};
// @test
    vector<int> a{-2, 0, 3, -5, 2, -1};
    NumArray na(a);
    H::check(vector<int>{na.sumRange(0, 2), na.sumRange(2, 5), na.sumRange(0, 5)}, vector<int>{1, -1, -3}, "NumArray ex1");
    vector<int> b{5};
    NumArray nb(b);
    H::check(nb.sumRange(0, 0), 5, "NumArray single");
