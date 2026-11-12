class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        size_t child = 0;
        for (int cookie : s)                                 // smallest cookie that fits the least greedy child
            if (child < g.size() && cookie >= g[child]) child++;
        return child;
    }
};
