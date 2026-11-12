class Solution {
    vector<string> out;
    void dfs(TreeNode* node, string path) {
        path += to_string(node->val);
        if (!node->left && !node->right) { out.push_back(path); return; }   // a leaf ends a path
        if (node->left) dfs(node->left, path + "->");
        if (node->right) dfs(node->right, path + "->");
    }
public:
    vector<string> binaryTreePaths(TreeNode* root) {
        dfs(root, "");
        return out;
    }
};
