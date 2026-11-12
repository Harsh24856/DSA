class Solution {
public:
    vector<int> getAverages(vector<int>& nums, int k) {
        long long w = 2LL * k + 1, s = 0;   // window size, window sum
        vector<int> out(nums.size(), -1);
        for (int i = 0; i < (int)nums.size(); i++) {
            s += nums[i];
            if (i >= w) s -= nums[i - w];
            if (i >= w - 1) out[i - k] = s / w;
        }
        return out;
    }
};
