class Codec {
public:
    // Encodes a tree to a single string: preorder values, comma separated.
    string serialize(TreeNode* root) {
        string out;
        function<void(TreeNode*)> pre = [&](TreeNode* n) {
            if (!n) return;
            out += (out.empty() ? "" : ",") + to_string(n->val);
            pre(n->left);
            pre(n->right);
        };
        pre(root);
        return out;
    }

    // Decodes your encoded data to tree.
    TreeNode* deserialize(string data) {
        vector<int> vals;
        stringstream ss(data);
        for (string x; getline(ss, x, ',');) vals.push_back(stoi(x));
        size_t i = 0;
        // the BST bounds tell where each preorder value belongs, so no null markers are needed
        function<TreeNode*(long long, long long)> build = [&](long long lo, long long hi) -> TreeNode* {
            if (i == vals.size() || !(lo < vals[i] && vals[i] < hi)) return nullptr;
            int v = vals[i++];
            TreeNode* left = build(lo, v);
            TreeNode* right = build(v, hi);
            return new TreeNode(v, left, right);
        };
        return build(LLONG_MIN, LLONG_MAX);
    }
};
// @test
    Codec c;
    for (vector<int> a : {vector<int>{2, 1, 3}, vector<int>{5, 3, 7, 2, 4, NUL, 8}})
        H::check(H::levelVec(c.deserialize(c.serialize(H::mkTree(a)))), a, "Codec");
    H::check(c.deserialize(c.serialize(nullptr)) == nullptr, true, "Codec empty");
