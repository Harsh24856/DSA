class Solution {
public:
    void sortColors(vector<int>& nums) {
        int lo = 0, mid = 0, hi = (int)nums.size() - 1;
        while (mid <= hi) {
            if (nums[mid] == 0) swap(nums[lo++], nums[mid++]);   // 0 goes to the front block
            else if (nums[mid] == 1) mid++;
            else swap(nums[mid], nums[hi--]);                    // 2 goes to the back; recheck nums[mid]
        }
    }
};
// @test
    vector<int> a = {2, 0, 2, 1, 1, 0}; Solution().sortColors(a); H::check(a, vector<int>{0, 0, 1, 1, 2, 2}, "sortColors 1");
    vector<int> b = {2, 0, 1}; Solution().sortColors(b); H::check(b, vector<int>{0, 1, 2}, "sortColors 2");
