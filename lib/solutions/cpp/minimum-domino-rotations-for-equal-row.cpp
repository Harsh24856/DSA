class Solution {
public:
    int minDominoRotations(vector<int>& tops, vector<int>& bottoms) {
        int best = INT_MAX;
        for (int v : {tops[0], bottoms[0]}) {   // the row must use one of the first domino's values
            int rotTop = 0, rotBottom = 0;
            bool ok = true;
            for (size_t i = 0; i < tops.size(); i++) {
                if (tops[i] != v && bottoms[i] != v) { ok = false; break; }
                if (tops[i] != v) rotTop++;
                if (bottoms[i] != v) rotBottom++;
            }
            if (ok) best = min({best, rotTop, rotBottom});
        }
        return best == INT_MAX ? -1 : best;
    }
};
