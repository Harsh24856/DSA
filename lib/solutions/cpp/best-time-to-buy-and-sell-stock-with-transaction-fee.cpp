class Solution {
public:
    int maxProfit(vector<int>& prices, int fee) {
        int cash = 0, hold = -prices[0];                     // best with no stock / with one
        for (size_t i = 1; i < prices.size(); i++) {
            int p = prices[i];
            int c = max(cash, hold + p - fee), h = max(hold, cash - p);
            cash = c; hold = h;
        }
        return cash;
    }
};
