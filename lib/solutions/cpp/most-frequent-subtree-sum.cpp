class Solution {
    unordered_map<int, int> freq;
    int best = 0;
    int sum(TreeNode* t) {
        if (!t) return 0;
        int s = t->val + sum(t->left) + sum(t->right);
        best = max(best, ++freq[s]);
        return s;
    }
public:
    vector<int> findFrequentTreeSum(TreeNode* root) {
        sum(root);
        vector<int> ans;
        for (auto& [s, c] : freq) if (c == best) ans.push_back(s);
        return ans;
    }
};
