class Solution {
    long long widest(vector<int>& cuts, int size) {
        sort(cuts.begin(), cuts.end());
        int best = max(cuts[0], size - cuts.back());   // pieces at the two edges
        for (size_t i = 1; i < cuts.size(); i++) best = max(best, cuts[i] - cuts[i - 1]);
        return best;
    }
public:
    int maxArea(int h, int w, vector<int>& horizontalCuts, vector<int>& verticalCuts) {
        return widest(horizontalCuts, h) * widest(verticalCuts, w) % 1'000'000'007;
    }
};
