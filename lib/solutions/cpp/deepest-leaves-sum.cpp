class Solution {
public:
    int deepestLeavesSum(TreeNode* root) {
        vector<TreeNode*> level{root};
        while (true) {
            vector<TreeNode*> next;
            for (TreeNode* n : level)
                for (TreeNode* c : {n->left, n->right})
                    if (c) next.push_back(c);
            if (next.empty()) {                            // this was the deepest level
                int sum = 0;
                for (TreeNode* n : level) sum += n->val;
                return sum;
            }
            level = next;
        }
    }
};
