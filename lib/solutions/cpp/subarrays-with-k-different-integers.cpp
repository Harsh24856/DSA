class Solution {
    // subarrays with at most k distinct values
    int atMost(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        int left = 0, res = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            cnt[nums[right]]++;
            while ((int)cnt.size() > k) {
                int y = nums[left++];
                if (--cnt[y] == 0) cnt.erase(y);
            }
            res += right - left + 1;
        }
        return res;
    }

public:
    int subarraysWithKDistinct(vector<int>& nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);   // exactly k
    }
};
