class Solution {
public:
    int minDepth(TreeNode* root) {
        if (!root) return 0;
        queue<pair<TreeNode*, int>> q;
        q.push({root, 1});
        while (!q.empty()) {
            auto [node, d] = q.front(); q.pop();
            if (!node->left && !node->right) return d;     // BFS: the first leaf is the shallowest
            if (node->left) q.push({node->left, d + 1});
            if (node->right) q.push({node->right, d + 1});
        }
        return 0;
    }
};
