class Solution {
public:
    long long minCost(vector<int>& nums, vector<int>& cost) {
        int n = nums.size();
        vector<pair<int, int>> pairs(n);
        for (int i = 0; i < n; i++) pairs[i] = {nums[i], cost[i]};
        sort(pairs.begin(), pairs.end());
        long long total = accumulate(cost.begin(), cost.end(), 0LL);
        long long half = (total + 1) / 2, acc = 0;
        int target = 0;
        for (auto [x, c] : pairs) {          // weighted median
            acc += c;
            if (acc >= half) { target = x; break; }
        }
        long long ans = 0;
        for (int i = 0; i < n; i++) ans += (long long)abs(nums[i] - target) * cost[i];
        return ans;
    }
};
