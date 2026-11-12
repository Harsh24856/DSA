class Solution {
public:
    vector<int> findMinHeightTrees(int n, vector<vector<int>>& edges) {
        if (n == 1) return {0};
        vector<unordered_set<int>> g(n);
        for (auto& e : edges) {
            g[e[0]].insert(e[1]);
            g[e[1]].insert(e[0]);
        }
        vector<int> leaves;
        for (int i = 0; i < n; i++)
            if (g[i].size() == 1) leaves.push_back(i);
        int left = n;
        while (left > 2) {   // peel leaves layer by layer; the last one or two are the centres
            left -= leaves.size();
            vector<int> nxt;
            for (int x : leaves) {
                int y = *g[x].begin();
                g[x].clear();
                g[y].erase(x);
                if (g[y].size() == 1) nxt.push_back(y);
            }
            leaves = nxt;
        }
        return leaves;
    }
};
// @test
    vector<vector<int>> a{{1, 0}, {1, 2}, {1, 3}}, b{{3, 0}, {3, 1}, {3, 2}, {3, 4}, {5, 4}}, c{}, d{{0, 1}};
    H::check(H::sorted(Solution().findMinHeightTrees(4, a)), vector<int>{1}, "a");
    H::check(H::sorted(Solution().findMinHeightTrees(6, b)), vector<int>{3, 4}, "b");
    H::check(H::sorted(Solution().findMinHeightTrees(1, c)), vector<int>{0}, "c");
    H::check(H::sorted(Solution().findMinHeightTrees(2, d)), vector<int>{0, 1}, "d");
