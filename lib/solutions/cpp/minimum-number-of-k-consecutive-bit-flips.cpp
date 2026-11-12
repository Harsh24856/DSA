class Solution {
public:
    int minKBitFlips(vector<int>& nums, int k) {
        int n = nums.size(), cur = 0, ans = 0;   // cur: parity of flips covering i
        vector<int> started(n, 0);
        for (int i = 0; i < n; i++) {
            if (i >= k) cur ^= started[i - k];   // a flip that no longer reaches i
            if ((nums[i] ^ cur) == 0) {          // still 0: start a flip here
                if (i + k > n) return -1;
                started[i] = 1;
                cur ^= 1;
                ans++;
            }
        }
        return ans;
    }
};
