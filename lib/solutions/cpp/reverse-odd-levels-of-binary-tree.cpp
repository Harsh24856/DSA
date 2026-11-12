class Solution {
public:
    TreeNode* reverseOddLevels(TreeNode* root) {
        vector<TreeNode*> level{root};
        int depth = 0;
        while (level[0]->left) {   // the tree is perfect, so one check is enough
            vector<TreeNode*> next;
            for (auto* n : level) { next.push_back(n->left); next.push_back(n->right); }
            level = next;
            if (++depth % 2) {
                // swap values from both ends inward
                for (int i = 0, j = level.size() - 1; i < j; i++, j--) swap(level[i]->val, level[j]->val);
            }
        }
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().reverseOddLevels(H::mkTree({2, 3, 5, 8, 13, 21, 34}))), vector<int>{2, 5, 3, 8, 13, 21, 34}, "a");
    H::check(H::levelVec(Solution().reverseOddLevels(H::mkTree({7, 13, 11}))), vector<int>{7, 11, 13}, "b");
    H::check(H::levelVec(Solution().reverseOddLevels(H::mkTree({0, 1, 2, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2}))), vector<int>{0, 2, 1, 0, 0, 0, 0, 2, 2, 2, 2, 1, 1, 1, 1}, "c");
