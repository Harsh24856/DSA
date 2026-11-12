class Solution {
public:
    long long kthLargestLevelSum(TreeNode* root, int k) {
        vector<long long> sums;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {                           // BFS, one level per round
            long long s = 0;
            for (int i = q.size(); i > 0; i--) {
                TreeNode* n = q.front(); q.pop();
                s += n->val;
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
            sums.push_back(s);
        }
        if ((int)sums.size() < k) return -1;
        sort(sums.rbegin(), sums.rend());
        return sums[k - 1];
    }
};
