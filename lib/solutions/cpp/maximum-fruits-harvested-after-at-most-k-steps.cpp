class Solution {
public:
    int maxTotalFruits(vector<vector<int>>& fruits, int startPos, int k) {
        int best = 0, total = 0, l = 0, n = fruits.size();
        for (auto& f : fruits) {
            int pr = f[0];
            total += f[1];
            while (l < n) {
                int pl = fruits[l][0];
                // the window [pl, pr] is reachable: walk it once plus the shorter way to one end
                if (pl > pr || (pr - pl) + min(abs(startPos - pl), abs(pr - startPos)) <= k) break;
                total -= fruits[l++][1];
            }
            best = max(best, total);
        }
        return best;
    }
};
