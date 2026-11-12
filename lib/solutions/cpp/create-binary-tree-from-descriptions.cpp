class Solution {
public:
    TreeNode* createBinaryTree(vector<vector<int>>& descriptions) {
        unordered_map<int, TreeNode*> nodes;
        unordered_set<int> kids;
        auto get = [&](int v) {
            auto& node = nodes[v];
            if (!node) node = new TreeNode(v);
            return node;
        };
        for (auto& d : descriptions) {
            TreeNode *a = get(d[0]), *b = get(d[1]);
            (d[2] ? a->left : a->right) = b;
            kids.insert(d[1]);
        }
        for (auto& d : descriptions)
            if (!kids.count(d[0])) return nodes[d[0]];   // the root is nobody's child
        return nullptr;
    }
};
// @test
    vector<vector<int>> a{{20, 15, 1}, {20, 17, 0}, {50, 20, 1}, {50, 80, 0}, {80, 19, 1}}, b{{1, 2, 1}, {2, 3, 0}, {3, 4, 1}};
    H::check(H::levelVec(Solution().createBinaryTree(a)), vector<int>{50, 20, 80, 15, 17, 19}, "a");
    H::check(H::levelVec(Solution().createBinaryTree(b)), vector<int>{1, 2, NUL, NUL, 3, 4}, "b");
