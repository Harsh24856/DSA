class Solution {
public:
    int maxJump(vector<int>& stones) {
        int best = stones[1] - stones[0];
        for (int i = 2; i < (int)stones.size(); i++)
            best = max(best, stones[i] - stones[i - 2]);   // go on every other stone, come back on the rest
        return best;
    }
};
