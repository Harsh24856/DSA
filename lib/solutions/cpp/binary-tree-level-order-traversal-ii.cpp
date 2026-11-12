class Solution {
public:
    vector<vector<int>> levelOrderBottom(TreeNode* root) {
        if (!root) return {};
        vector<vector<int>> out;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            vector<int> level;
            for (int k = q.size(); k > 0; k--) {
                TreeNode* n = q.front();
                q.pop();
                level.push_back(n->val);
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
            out.push_back(level);
        }
        reverse(out.begin(), out.end());   // bottom level first
        return out;
    }
};
