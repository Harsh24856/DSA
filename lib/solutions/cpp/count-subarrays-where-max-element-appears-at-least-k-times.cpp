class Solution {
public:
    long long countSubarrays(vector<int>& nums, int k) {
        int mx = *max_element(nums.begin(), nums.end());
        long long ans = 0;
        int left = 0, cnt = 0;
        for (int x : nums) {
            if (x == mx) cnt++;
            while (cnt >= k) {            // shrink until the window has fewer than k
                if (nums[left] == mx) cnt--;
                left++;
            }
            ans += left;                  // starts 0..left-1 all reach k copies
        }
        return ans;
    }
};
