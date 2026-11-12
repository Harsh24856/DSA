class Solution {
public:
    int minOperations(vector<int>& nums) {
        int n = nums.size(), ones = count(nums.begin(), nums.end(), 1);
        if (ones) return n - ones;   // each 1 spreads to a neighbour in one step
        int best = INT_MAX;
        for (int i = 0; i < n; i++) {
            int g = nums[i];
            for (int j = i + 1; j < n; j++) {
                g = gcd(g, nums[j]);
                if (g == 1) { best = min(best, j - i); break; }   // shortest window with gcd 1
            }
        }
        return best == INT_MAX ? -1 : best + n - 1;
    }
};
