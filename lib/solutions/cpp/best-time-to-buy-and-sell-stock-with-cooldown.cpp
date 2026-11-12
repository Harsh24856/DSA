class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int hold = INT_MIN, sold = 0, rest = 0;              // holding, just sold, free to buy
        for (int p : prices) {
            int h = max(hold, rest - p), s = hold + p, r = max(rest, sold);
            hold = h; sold = s; rest = r;
        }
        return max(sold, rest);
    }
};
