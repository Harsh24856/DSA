class Solution {
    int x, l = 0, r = 0;   // sizes of x's left and right subtrees
    int count(TreeNode* node) {
        if (!node) return 0;
        int a = count(node->left), b = count(node->right);
        if (node->val == x) { l = a; r = b; }
        return a + b + 1;
    }
public:
    bool btreeGameWinningMove(TreeNode* root, int n, int x) {
        this->x = x;
        count(root);
        return max({l, r, n - 1 - l - r}) > n / 2;   // take the biggest of the three regions
    }
};
