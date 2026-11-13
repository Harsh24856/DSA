class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        int k = 1;                                        // nums[0..k-1] holds each value once
        for (int i = 1; i < (int)nums.size(); i++)
            if (nums[i] != nums[k - 1]) nums[k++] = nums[i];
        return k;
    }
};
// @test
    vector<int> a{1, 1, 2};
    H::check(Solution().removeDuplicates(a), 2, "removeDuplicates example 1");
    H::check(vector<int>(a.begin(), a.begin() + 2), vector<int>{1, 2}, "prefix 1");
    vector<int> b{0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
    H::check(Solution().removeDuplicates(b), 5, "removeDuplicates example 2");
    H::check(vector<int>(b.begin(), b.begin() + 5), vector<int>{0, 1, 2, 3, 4}, "prefix 2");
    vector<int> c{7};
    H::check(Solution().removeDuplicates(c), 1, "single");
