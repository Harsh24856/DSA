class Solution {
public:
    bool isCompleteTree(TreeNode* root) {
        queue<TreeNode*> q;
        q.push(root);
        bool gap = false;
        while (!q.empty()) {
            TreeNode* node = q.front(); q.pop();
            if (!node) gap = true;                      // first missing slot in level order
            else if (gap) return false;                 // a real node after a gap
            else { q.push(node->left); q.push(node->right); }
        }
        return true;
    }
};
