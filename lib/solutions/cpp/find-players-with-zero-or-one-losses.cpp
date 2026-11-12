class Solution {
public:
    vector<vector<int>> findWinners(vector<vector<int>>& matches) {
        map<int, int> losses;   // every player -> losses, sorted by player
        for (auto& m : matches) { losses[m[0]] += 0; losses[m[1]]++; }
        vector<vector<int>> out(2);
        for (auto [p, l] : losses)
            if (l <= 1) out[l].push_back(p);
        return out;
    }
};
