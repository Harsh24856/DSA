class Solution {
public:
    long long countGood(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        long long pairs = 0, ans = 0;
        int L = 0;
        for (int x : nums) {
            pairs += cnt[x]++;            // x pairs with every earlier copy
            while (pairs >= k) {          // shrink while the window is still good
                pairs -= --cnt[nums[L]];
                L++;
            }
            ans += L;                     // starts 0..L-1 all give a good subarray
        }
        return ans;
    }
};
