class Solution {
    unordered_set<int> kill;
    vector<TreeNode*> out;

    TreeNode* dfs(TreeNode* node, bool parentGone) {
        if (!node) return nullptr;
        bool gone = kill.count(node->val);
        if (parentGone && !gone) out.push_back(node);   // a kept node under a deleted one starts a tree
        node->left = dfs(node->left, gone);
        node->right = dfs(node->right, gone);
        return gone ? nullptr : node;
    }

public:
    vector<TreeNode*> delNodes(TreeNode* root, vector<int>& to_delete) {
        kill = unordered_set<int>(to_delete.begin(), to_delete.end());
        dfs(root, true);
        return out;
    }
};
// @test
    auto run = [](vector<int> a, vector<int> d) {
        vector<vector<int>> res;
        for (auto* t : Solution().delNodes(H::mkTree(a), d)) res.push_back(H::levelVec(t));
        sort(res.begin(), res.end(), [](auto& x, auto& y) { return x[0] < y[0]; });
        return res;
    };
    H::check(run({1, 2, 3, 4, 5, 6, 7}, {3, 5}), vector<vector<int>>{{1, 2, NUL, 4}, {6}, {7}}, "a");
    H::check(run({1, 2, 4, NUL, 3}, {3}), vector<vector<int>>{{1, 2, 4}}, "b");
    H::check(run({1}, {1}), vector<vector<int>>{}, "c");
