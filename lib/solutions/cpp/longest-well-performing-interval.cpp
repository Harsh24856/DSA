class Solution {
public:
    int longestWPI(vector<int>& hours) {
        unordered_map<int, int> first;   // prefix score -> first index it appeared
        int s = 0, best = 0;
        for (int i = 0; i < (int)hours.size(); i++) {
            s += hours[i] > 8 ? 1 : -1;
            if (s > 0) best = i + 1;
            else if (auto it = first.find(s - 1); it != first.end()) best = max(best, i - it->second);
            first.emplace(s, i);         // keeps the earliest index only
        }
        return best;
    }
};
