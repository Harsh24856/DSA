class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
        // those who save most by going to A come first
        sort(costs.begin(), costs.end(), [](auto& x, auto& y) { return x[0] - x[1] < y[0] - y[1]; });
        int n = costs.size() / 2, total = 0;
        for (int i = 0; i < n; i++) total += costs[i][0];
        for (int i = n; i < 2 * n; i++) total += costs[i][1];
        return total;
    }
};
