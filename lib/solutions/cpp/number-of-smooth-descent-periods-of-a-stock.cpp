class Solution {
public:
    long long getDescentPeriods(vector<int>& prices) {
        long long ans = 0, run = 0;
        for (size_t i = 0; i < prices.size(); i++) {
            run = (i && prices[i - 1] - prices[i] == 1) ? run + 1 : 1;   // periods ending at i
            ans += run;
        }
        return ans;
    }
};
