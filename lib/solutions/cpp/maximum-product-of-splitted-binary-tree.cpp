class Solution {
public:
    int maxProduct(TreeNode* root) {
        vector<long long> sums;                        // sum of every subtree
        function<long long(TreeNode*)> s = [&](TreeNode* node) -> long long {
            if (!node) return 0;
            long long t = node->val + s(node->left) + s(node->right);
            sums.push_back(t);
            return t;
        };
        long long total = s(root), best = 0;
        for (long long x : sums) best = max(best, x * (total - x));   // cut above this subtree
        return best % 1000000007;                      // take the max first, then the modulo
    }
};
