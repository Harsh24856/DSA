class Solution {
public:
    TreeNode* replaceValueInTree(TreeNode* root) {
        root->val = 0;
        vector<TreeNode*> level{root};
        while (!level.empty()) {
            vector<TreeNode*> next;
            long long total = 0;                        // sum of the next level
            for (auto* n : level)
                for (auto* c : {n->left, n->right})
                    if (c) { next.push_back(c); total += c->val; }
            for (auto* n : level) {
                int kids = (n->left ? n->left->val : 0) + (n->right ? n->right->val : 0);
                for (auto* c : {n->left, n->right})
                    if (c) c->val = total - kids;       // everyone on the level but the siblings
            }
            level = next;
        }
        return root;
    }
};
// @test
    for (auto& [a, e] : vector<pair<vector<int>, vector<int>>>{{{5, 4, 9, 1, 10, NUL, 7}, {0, 0, 0, 7, 7, NUL, 11}}, {{3, 1, 2}, {0, 0, 0}}, {{1}, {0}}})
        H::check(H::levelVec(Solution().replaceValueInTree(H::mkTree(a))), e, "replaceValueInTree " + H::str(a));
