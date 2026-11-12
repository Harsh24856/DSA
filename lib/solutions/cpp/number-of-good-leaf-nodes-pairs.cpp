class Solution {
public:
    int countPairs(TreeNode* root, int distance) {
        int ans = 0;
        // distances from node down to each leaf below it, only those still under distance
        function<vector<int>(TreeNode*)> dfs = [&](TreeNode* node) -> vector<int> {
            if (!node) return {};
            if (!node->left && !node->right) return {1};
            vector<int> L = dfs(node->left), R = dfs(node->right);
            for (int a : L)
                for (int b : R)
                    if (a + b <= distance) ans++;      // pairs that meet at this node
            vector<int> up;
            for (auto* side : {&L, &R})
                for (int d : *side)
                    if (d + 1 < distance) up.push_back(d + 1);
            return up;
        };
        dfs(root);
        return ans;
    }
};
