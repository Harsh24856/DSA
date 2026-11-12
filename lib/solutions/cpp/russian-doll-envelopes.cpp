class Solution {
public:
    int maxEnvelopes(vector<vector<int>>& envelopes) {
        // width ascending, height descending for equal widths
        sort(envelopes.begin(), envelopes.end(), [](auto& a, auto& b) {
            return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];
        });
        vector<int> tails;                                 // LIS of heights
        for (auto& e : envelopes) {
            auto it = lower_bound(tails.begin(), tails.end(), e[1]);
            if (it == tails.end()) tails.push_back(e[1]);
            else *it = e[1];
        }
        return tails.size();
    }
};
