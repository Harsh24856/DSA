class Solution {
public:
    int countNodes(TreeNode* root) {
        if (!root) return 0;
        int lh = 0, rh = 0;
        for (TreeNode* l = root; l; l = l->left) lh++;
        for (TreeNode* r = root; r; r = r->right) rh++;
        if (lh == rh) return (1 << lh) - 1;                // perfect tree: no need to look inside
        return 1 + countNodes(root->left) + countNodes(root->right);
    }
};
