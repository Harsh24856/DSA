class Solution {
public:
    int equalSubstring(string s, string t, int maxCost) {
        int L = 0, cost = 0, best = 0;
        for (int R = 0; R < (int)s.size(); R++) {
            cost += abs(s[R] - t[R]);
            while (cost > maxCost) {   // over budget: drop from the left
                cost -= abs(s[L] - t[L]);
                L++;
            }
            best = max(best, R - L + 1);
        }
        return best;
    }
};
