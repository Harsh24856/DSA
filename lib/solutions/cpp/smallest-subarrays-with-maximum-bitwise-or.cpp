class Solution {
public:
    vector<int> smallestSubarrays(vector<int>& nums) {
        int n = nums.size();
        vector<int> last(32, 0), out(n, 1);                // last[b]: nearest index >= i with bit b
        for (int i = n - 1; i >= 0; i--) {
            for (int b = 0; b < 32; b++)
                if (nums[i] >> b & 1) last[b] = i;
            out[i] = max(1, *max_element(last.begin(), last.end()) - i + 1);
        }
        return out;
    }
};
