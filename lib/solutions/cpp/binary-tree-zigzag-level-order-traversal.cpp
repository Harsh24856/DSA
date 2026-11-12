class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
        vector<vector<int>> out;
        vector<TreeNode*> level;
        if (root) level.push_back(root);
        bool flip = false;
        while (!level.empty()) {
            vector<int> vals;
            for (TreeNode* n : level) vals.push_back(n->val);
            if (flip) reverse(vals.begin(), vals.end());   // every other level right to left
            out.push_back(vals);
            flip = !flip;
            vector<TreeNode*> next;
            for (TreeNode* n : level)
                for (TreeNode* c : {n->left, n->right})
                    if (c) next.push_back(c);
            level = next;
        }
        return out;
    }
};
