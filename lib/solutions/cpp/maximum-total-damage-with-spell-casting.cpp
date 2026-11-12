class Solution {
public:
    long long maximumTotalDamage(vector<int>& power) {
        map<int, long long> cnt;
        for (int p : power) cnt[p]++;
        vector<pair<int, long long>> vals(cnt.begin(), cnt.end());   // sorted distinct values
        vector<long long> dp(vals.size() + 1, 0);                    // dp[i] = best using the first i values
        size_t j = 0;
        for (size_t i = 0; i < vals.size(); i++) {
            auto [v, c] = vals[i];
            while (vals[j].first < v - 2) j++;          // vals[..j) can sit next to v
            dp[i + 1] = max(dp[i], dp[j] + v * c);
        }
        return dp.back();
    }
};
