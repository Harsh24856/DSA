class Solution {
public:
    int findLongestChain(vector<vector<int>>& pairs) {
        sort(pairs.begin(), pairs.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // earliest end first
        long long end = LLONG_MIN;
        int count = 0;
        for (auto& p : pairs)
            if (p[0] > end) { end = p[1]; count++; }
        return count;
    }
};
