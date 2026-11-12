class Solution {
public:
    bool isEvenOddTree(TreeNode* root) {
        queue<TreeNode*> q;
        q.push(root);
        for (int level = 0; !q.empty(); level++) {
            optional<int> prev;
            for (int k = q.size(); k > 0; k--) {
                TreeNode* node = q.front(); q.pop();
                int v = node->val;
                if (level % 2 == 0) {   // even level: odd values, strictly increasing
                    if (v % 2 == 0 || (prev && v <= *prev)) return false;
                } else {                // odd level: even values, strictly decreasing
                    if (v % 2 == 1 || (prev && v >= *prev)) return false;
                }
                prev = v;
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
        }
        return true;
    }
};
