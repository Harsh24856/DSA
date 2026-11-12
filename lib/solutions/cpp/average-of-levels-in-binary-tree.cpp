class Solution {
public:
    vector<double> averageOfLevels(TreeNode* root) {
        vector<double> out;
        vector<TreeNode*> level{root};
        while (!level.empty()) {
            double sum = 0;                                  // double: node sums can pass int range
            for (TreeNode* n : level) sum += n->val;
            out.push_back(sum / level.size());
            vector<TreeNode*> next;
            for (TreeNode* n : level)
                for (TreeNode* c : {n->left, n->right}) if (c) next.push_back(c);
            level = next;
        }
        return out;
    }
};
