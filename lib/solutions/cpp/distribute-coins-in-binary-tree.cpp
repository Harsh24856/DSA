class Solution {
    int moves = 0;
    // coins this subtree sends up to its parent (negative: it needs coins)
    int excess(TreeNode* node) {
        if (!node) return 0;
        int e = excess(node->left) + excess(node->right) + node->val - 1;
        moves += abs(e);   // every extra or missing coin crosses the edge above
        return e;
    }
public:
    int distributeCoins(TreeNode* root) {
        excess(root);
        return moves;
    }
};
