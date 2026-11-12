class Solution {
public:
    int maximumSum(vector<int>& nums) {
        unordered_map<int, int> best;   // digit sum -> largest number seen with it
        int ans = -1;
        for (int x : nums) {
            int d = 0;
            for (int y = x; y; y /= 10) d += y % 10;
            auto it = best.find(d);
            if (it != best.end()) {
                ans = max(ans, it->second + x);
                it->second = max(it->second, x);
            } else {
                best[d] = x;
            }
        }
        return ans;
    }
};
