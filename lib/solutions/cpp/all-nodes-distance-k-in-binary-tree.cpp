class Solution {
public:
    vector<int> distanceK(TreeNode* root, TreeNode* target, int k) {
        unordered_map<TreeNode*, TreeNode*> parent{{root, nullptr}};
        vector<TreeNode*> st{root};
        while (!st.empty()) {                              // record every node's parent
            TreeNode* n = st.back(); st.pop_back();
            for (TreeNode* c : {n->left, n->right})
                if (c) { parent[c] = n; st.push_back(c); }
        }
        queue<TreeNode*> q;
        q.push(target);
        unordered_set<TreeNode*> seen{target};
        for (int step = 0; step < k; step++) {             // BFS k rings out, through children and parent
            for (int s = q.size(); s > 0; s--) {
                TreeNode* n = q.front(); q.pop();
                for (TreeNode* m : {n->left, n->right, parent[n]})
                    if (m && !seen.count(m)) { seen.insert(m); q.push(m); }
            }
        }
        vector<int> out;
        for (; !q.empty(); q.pop()) out.push_back(q.front()->val);
        return out;
    }
};
// @test
    TreeNode* root = H::mkTree({3, 5, 1, 6, 2, 0, 8, NUL, NUL, 7, 4});
    H::check(H::sorted(Solution().distanceK(root, H::find(root, 5), 2)), vector<int>{1, 4, 7}, "distanceK");
