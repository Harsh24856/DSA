class Solution {
    unordered_map<long long, int> seen;                    // prefix sums on the current root path
    int dfs(TreeNode* node, long long run, int target) {
        if (!node) return 0;
        run += node->val;
        int count = seen.count(run - target) ? seen[run - target] : 0;
        seen[run]++;
        count += dfs(node->left, run, target) + dfs(node->right, run, target);
        seen[run]--;                                       // leave this node: no longer an ancestor
        return count;
    }
public:
    int pathSum(TreeNode* root, int targetSum) {
        seen[0] = 1;
        return dfs(root, 0, targetSum);
    }
};
