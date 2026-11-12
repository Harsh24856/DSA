class Solution {
public:
    int widthOfBinaryTree(TreeNode* root) {
        unsigned long long best = 0;
        vector<pair<TreeNode*, unsigned long long>> level{{root, 0}};   // node and its heap index
        while (!level.empty()) {
            unsigned long long first = level[0].second;
            best = max(best, level.back().second - first + 1);
            vector<pair<TreeNode*, unsigned long long>> next;
            for (auto [node, i] : level) {
                i -= first;                                  // renumber from 0 so indices stay small
                if (node->left) next.push_back({node->left, 2 * i});
                if (node->right) next.push_back({node->right, 2 * i + 1});
            }
            level = next;
        }
        return (int)best;
    }
};
