class Codec {
    void write(TreeNode* node, string& out) {                // preorder, # for null
        if (!out.empty()) out += ',';
        if (!node) { out += '#'; return; }
        out += to_string(node->val);
        write(node->left, out);
        write(node->right, out);
    }
    TreeNode* read(istringstream& in) {
        string v;
        getline(in, v, ',');
        if (v == "#") return nullptr;
        TreeNode* node = new TreeNode(stoi(v));
        node->left = read(in);
        node->right = read(in);
        return node;
    }
public:
    string serialize(TreeNode* root) {
        string out;
        write(root, out);
        return out;
    }

    TreeNode* deserialize(string data) {
        istringstream in(data);
        return read(in);
    }
};
// @test
    Codec c;
    for (vector<int> a : {vector<int>{1, 2, 3, NUL, NUL, 4, 5}, vector<int>{}, vector<int>{1, NUL, 2, NUL, 3}}) {
        TreeNode* r = c.deserialize(c.serialize(H::mkTree(a)));
        H::check(r ? H::levelVec(r) : vector<int>{}, a, "Codec " + H::str(a));
    }
