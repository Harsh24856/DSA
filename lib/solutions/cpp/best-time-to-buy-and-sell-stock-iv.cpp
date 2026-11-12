class Solution {
public:
    int maxProfit(int k, vector<int>& prices) {
        vector<int> buy(k + 1, INT_MIN), sell(k + 1, 0);     // best cash holding a stock / not, after t buys
        for (int p : prices)
            for (int t = 1; t <= k; t++) {
                buy[t] = max(buy[t], sell[t - 1] - p);
                sell[t] = max(sell[t], buy[t] + p);
            }
        return sell[k];
    }
};
