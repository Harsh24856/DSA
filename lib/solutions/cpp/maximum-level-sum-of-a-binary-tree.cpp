class Solution {
public:
    int maxLevelSum(TreeNode* root) {
        long long best = LLONG_MIN;
        int ans = 1, level = 1;
        vector<TreeNode*> row{root};
        while (!row.empty()) {
            long long s = 0;
            for (auto* n : row) s += n->val;
            if (s > best) { best = s; ans = level; }   // strict: keep the smallest level
            vector<TreeNode*> next;
            for (auto* n : row) {
                if (n->left) next.push_back(n->left);
                if (n->right) next.push_back(n->right);
            }
            row = next;
            level++;
        }
        return ans;
    }
};
