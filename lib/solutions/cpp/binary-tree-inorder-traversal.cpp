class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> out;
        stack<TreeNode*> st;
        TreeNode* node = root;
        while (!st.empty() || node) {
            while (node) { st.push(node); node = node->left; }   // go as far left as possible
            node = st.top(); st.pop();
            out.push_back(node->val);
            node = node->right;
        }
        return out;
    }
};
