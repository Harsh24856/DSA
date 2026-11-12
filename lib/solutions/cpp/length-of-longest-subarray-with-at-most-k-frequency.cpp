class Solution {
public:
    int maxSubarrayLength(vector<int>& nums, int k) {
        unordered_map<int, int> count;
        int left = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            int x = nums[right];
            count[x]++;
            while (count[x] > k) count[nums[left++]]--;   // shrink until x is allowed again
            best = max(best, right - left + 1);
        }
        return best;
    }
};
