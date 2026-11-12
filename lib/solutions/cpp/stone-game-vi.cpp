class Solution {
public:
    int stoneGameVI(vector<int>& aliceValues, vector<int>& bobValues) {
        int n = aliceValues.size();
        vector<int> order(n);
        iota(order.begin(), order.end(), 0);
        // a stone is worth its value to you plus what it denies the other player
        sort(order.begin(), order.end(), [&](int a, int b) { return aliceValues[a] + bobValues[a] > aliceValues[b] + bobValues[b]; });
        int diff = 0;
        for (int turn = 0; turn < n; turn++) {
            int i = order[turn];
            diff += turn % 2 == 0 ? aliceValues[i] : -bobValues[i];
        }
        return (diff > 0) - (diff < 0);
    }
};
