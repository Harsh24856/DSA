class Solution {
public:
    int minimumIndex(vector<int>& nums) {
        int cand = 0, cnt = 0;
        for (int x : nums) {                  // Boyer-Moore vote
            if (cnt == 0) cand = x;
            cnt += x == cand ? 1 : -1;
        }
        int n = nums.size(), total = count(nums.begin(), nums.end(), cand), left = 0;
        for (int i = 0; i + 1 < n; i++) {
            left += nums[i] == cand;
            if (left * 2 > i + 1 && (total - left) * 2 > n - i - 1) return i;
        }
        return -1;
    }
};
