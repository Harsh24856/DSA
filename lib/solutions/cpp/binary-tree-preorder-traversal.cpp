class Solution {
public:
    vector<int> preorderTraversal(TreeNode* root) {
        vector<int> out;
        vector<TreeNode*> st;
        if (root) st.push_back(root);
        while (!st.empty()) {
            TreeNode* node = st.back(); st.pop_back();
            out.push_back(node->val);
            if (node->right) st.push_back(node->right);    // right first so left pops first
            if (node->left) st.push_back(node->left);
        }
        return out;
    }
};
