class Solution {
    int line(vector<int>::const_iterator b, vector<int>::const_iterator e) {
        int prev = 0, cur = 0;
        for (; b != e; ++b) {
            int nxt = max(cur, prev + *b);
            prev = cur;
            cur = nxt;
        }
        return cur;
    }
public:
    int rob(vector<int>& nums) {
        if (nums.size() == 1) return nums[0];
        // first and last are neighbours: drop one of them
        return max(line(nums.begin(), nums.end() - 1), line(nums.begin() + 1, nums.end()));
    }
};
