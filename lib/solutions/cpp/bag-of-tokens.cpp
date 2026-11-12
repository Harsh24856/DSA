class Solution {
public:
    int bagOfTokensScore(vector<int>& tokens, int power) {
        sort(tokens.begin(), tokens.end());
        int lo = 0, hi = (int)tokens.size() - 1, score = 0, best = 0;
        while (lo <= hi) {
            if (power >= tokens[lo]) {       // buy a point with the cheapest token
                power -= tokens[lo++];
                best = max(best, ++score);
            } else if (score) {              // sell a point for the dearest token
                power += tokens[hi--];
                score--;
            } else break;
        }
        return best;
    }
};
