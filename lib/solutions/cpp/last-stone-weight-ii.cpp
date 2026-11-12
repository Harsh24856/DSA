class Solution {
public:
    int lastStoneWeightII(vector<int>& stones) {
        int total = accumulate(stones.begin(), stones.end(), 0);
        set<int> reach{0};                                   // subset sums up to total / 2
        for (int x : stones) {
            vector<int> add;
            for (int s : reach) if (s + x <= total / 2) add.push_back(s + x);
            reach.insert(add.begin(), add.end());
        }
        return total - 2 * *reach.rbegin();                  // closest split to two equal piles
    }
};
