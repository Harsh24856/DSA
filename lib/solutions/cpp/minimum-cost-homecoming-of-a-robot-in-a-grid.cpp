class Solution {
public:
    int minCost(vector<int>& startPos, vector<int>& homePos, vector<int>& rowCosts, vector<int>& colCosts) {
        int r0 = startPos[0], c0 = startPos[1], r1 = homePos[0], c1 = homePos[1];
        int cost = 0;
        // every row and column between start and home is entered once, whatever the path
        if (r1 >= r0) for (int r = r0 + 1; r <= r1; r++) cost += rowCosts[r];
        else for (int r = r1; r < r0; r++) cost += rowCosts[r];
        if (c1 >= c0) for (int c = c0 + 1; c <= c1; c++) cost += colCosts[c];
        else for (int c = c1; c < c0; c++) cost += colCosts[c];
        return cost;
    }
};
