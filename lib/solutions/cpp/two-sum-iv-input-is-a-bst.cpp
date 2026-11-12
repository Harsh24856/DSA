class Solution {
    unordered_set<int> seen;
public:
    bool findTarget(TreeNode* root, int k) {
        if (!root) return false;
        if (seen.count(k - root->val)) return true;          // its partner was visited already
        seen.insert(root->val);
        return findTarget(root->left, k) || findTarget(root->right, k);
    }
};
