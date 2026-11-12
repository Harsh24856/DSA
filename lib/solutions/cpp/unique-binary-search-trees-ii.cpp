class Solution {
public:
    vector<TreeNode*> generateTrees(int n) {
        map<pair<int, int>, vector<TreeNode*>> memo;       // subtrees are shared, as with lru_cache
        function<vector<TreeNode*>(int, int)> build = [&](int lo, int hi) -> vector<TreeNode*> {
            if (lo > hi) return {nullptr};
            auto it = memo.find({lo, hi});
            if (it != memo.end()) return it->second;
            vector<TreeNode*> out;
            for (int root = lo; root <= hi; root++)
                for (TreeNode* left : build(lo, root - 1))
                    for (TreeNode* right : build(root + 1, hi))
                        out.push_back(new TreeNode(root, left, right));
            return memo[{lo, hi}] = out;
        };
        return build(1, n);
    }
};
// @test
    auto key = [](vector<TreeNode*> ts) { vector<vector<int>> out; for (TreeNode* t : ts) out.push_back(H::levelVec(t)); return H::sorted(out); };
    H::check(key(Solution().generateTrees(3)), H::sorted(vector<vector<int>>{{1, NUL, 2, NUL, 3}, {1, NUL, 3, 2}, {2, 1, 3}, {3, 1, NUL, NUL, 2}, {3, 2, NUL, 1}}), "n3");
    H::check(key(Solution().generateTrees(1)), vector<vector<int>>{{1}}, "n1");
