class Solution {
    int cams = 0;
    // 0 = needs cover, 1 = has camera, 2 = covered
    int dfs(TreeNode* node) {
        if (!node) return 2;
        int l = dfs(node->left), r = dfs(node->right);
        if (l == 0 || r == 0) {   // a child is uncovered: put a camera here
            cams++;
            return 1;
        }
        return l == 1 || r == 1 ? 2 : 0;
    }

public:
    int minCameraCover(TreeNode* root) {
        int rootState = dfs(root);
        return cams + (rootState == 0);
    }
};
