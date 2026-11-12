class Solution {
public:
    vector<int> largestValues(TreeNode* root) {
        vector<int> out;
        queue<TreeNode*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            int best = INT_MIN;
            for (int k = q.size(); k > 0; k--) {   // one row at a time
                TreeNode* node = q.front(); q.pop();
                best = max(best, node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            out.push_back(best);
        }
        return out;
    }
};
