class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int total = 0;
        for (size_t i = 1; i < prices.size(); i++) total += max(0, prices[i] - prices[i - 1]);   // take every rise
        return total;
    }
};
