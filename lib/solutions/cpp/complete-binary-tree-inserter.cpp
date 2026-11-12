class CBTInserter {
    vector<TreeNode*> a;                               // nodes in level order: parent of i is (i - 1) / 2
public:
    CBTInserter(TreeNode* root) {
        a.push_back(root);
        for (size_t i = 0; i < a.size(); i++) {
            if (a[i]->left) a.push_back(a[i]->left);
            if (a[i]->right) a.push_back(a[i]->right);
        }
    }

    int insert(int val) {
        TreeNode* node = new TreeNode(val);
        TreeNode* p = a[(a.size() - 1) / 2];           // parent of the next free slot
        if (!p->left) p->left = node;
        else p->right = node;
        a.push_back(node);
        return p->val;
    }

    TreeNode* get_root() { return a[0]; }
};
// @test
    CBTInserter cb(H::mkTree({1, 2}));
    H::check(cb.insert(3), 1, "insert 3");
    H::check(cb.insert(4), 2, "insert 4");
    H::check(H::levelVec(cb.get_root()), vector<int>{1, 2, 3, 4}, "root");
