class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        stack<TreeNode*> st;
        TreeNode* node = root;
        while (true) {                                       // iterative inorder
            for (; node; node = node->left) st.push(node);
            node = st.top(); st.pop();
            if (--k == 0) return node->val;
            node = node->right;
        }
    }
};
