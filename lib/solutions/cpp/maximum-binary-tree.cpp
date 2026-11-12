class Solution {
    TreeNode* build(vector<int>& nums, int lo, int hi) {   // nums[lo..hi)
        if (lo >= hi) return nullptr;
        int i = max_element(nums.begin() + lo, nums.begin() + hi) - nums.begin();   // the maximum is the root
        return new TreeNode(nums[i], build(nums, lo, i), build(nums, i + 1, hi));
    }
public:
    TreeNode* constructMaximumBinaryTree(vector<int>& nums) {
        return build(nums, 0, nums.size());
    }
};
// @test
    vector<int> a{3, 2, 1, 6, 0, 5}, b{3, 2, 1};
    H::check(H::levelVec(Solution().constructMaximumBinaryTree(a)), vector<int>{6, 3, 5, NUL, 2, 0, NUL, NUL, 1}, "a");
    H::check(H::levelVec(Solution().constructMaximumBinaryTree(b)), vector<int>{3, NUL, 2, NUL, 1}, "b");
