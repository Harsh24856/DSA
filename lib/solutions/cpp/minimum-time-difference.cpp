class Solution {
public:
    int findMinDifference(vector<string>& timePoints) {
        vector<int> m;
        for (auto& t : timePoints) m.push_back(stoi(t.substr(0, 2)) * 60 + stoi(t.substr(3)));
        sort(m.begin(), m.end());
        int best = m[0] + 1440 - m.back();   // wrap past midnight
        for (size_t i = 1; i < m.size(); i++) best = min(best, m[i] - m[i - 1]);
        return best;
    }
};
