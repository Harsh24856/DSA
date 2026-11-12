class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
        vector<int> out;
        vector<TreeNode*> level;
        if (root) level.push_back(root);
        while (!level.empty()) {
            out.push_back(level.back()->val);              // rightmost node of the level
            vector<TreeNode*> next;
            for (TreeNode* n : level)
                for (TreeNode* c : {n->left, n->right})
                    if (c) next.push_back(c);
            level = next;
        }
        return out;
    }
};
