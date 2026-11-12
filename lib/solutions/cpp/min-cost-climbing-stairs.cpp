class Solution {
public:
    int minCostClimbingStairs(vector<int>& cost) {
        int a = cost[0], b = cost[1];                        // cheapest way to stand on the last two steps
        for (size_t i = 2; i < cost.size(); i++) {
            int c = cost[i] + min(a, b);
            a = b;
            b = c;
        }
        return min(a, b);
    }
};
