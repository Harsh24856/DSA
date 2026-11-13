// Binary search tree from scratch: left subtree < node < right subtree, no duplicates.
class BST {
    struct Node {
        int val;
        Node *left = nullptr, *right = nullptr;
        Node(int v) : val(v) {}
    };
    Node* root = nullptr;
    int count = 0;

    static Node* erase(Node* node, int key, bool& done) {
        if (!node) return nullptr;
        if (key < node->val) node->left = erase(node->left, key, done);
        else if (key > node->val) node->right = erase(node->right, key, done);
        else {
            done = true;
            if (!node->left || !node->right) {           // no child or one child: lift the other side
                Node* child = node->left ? node->left : node->right;
                delete node;
                return child;
            }
            Node* succ = node->right;                     // two children: copy the inorder successor
            while (succ->left) succ = succ->left;
            node->val = succ->val;
            bool unused = false;
            node->right = erase(node->right, succ->val, unused);
        }
        return node;
    }
    static int height(Node* n) { return n ? 1 + max(height(n->left), height(n->right)) : -1; }
    static void free(Node* n) { if (n) { free(n->left); free(n->right); delete n; } }

public:
    ~BST() { free(root); }
    int size() const { return count; }

    bool search(int key) const {                          // O(h)
        Node* n = root;
        while (n && n->val != key) n = key < n->val ? n->left : n->right;
        return n != nullptr;
    }
    bool insert(int key) {                                // O(h): hang a new leaf where the walk falls off
        Node** slot = &root;
        while (*slot) {
            if (key == (*slot)->val) return false;
            slot = key < (*slot)->val ? &(*slot)->left : &(*slot)->right;
        }
        *slot = new Node(key);
        count++;
        return true;
    }
    bool erase(int key) {                                 // O(h)
        bool done = false;
        root = erase(root, key, done);
        count -= done;
        return done;
    }
    int height() const { return height(root); }          // edges; empty tree is -1

    vector<int> preorder() const {                        // node, left, right
        vector<int> out;
        vector<Node*> st;
        if (root) st.push_back(root);
        while (!st.empty()) {
            Node* n = st.back(); st.pop_back();
            out.push_back(n->val);
            if (n->right) st.push_back(n->right);
            if (n->left) st.push_back(n->left);
        }
        return out;
    }
    vector<int> inorder() const {                         // left, node, right: sorted
        vector<int> out;
        vector<Node*> st;
        Node* n = root;
        while (n || !st.empty()) {
            while (n) { st.push_back(n); n = n->left; }
            n = st.back(); st.pop_back();
            out.push_back(n->val);
            n = n->right;
        }
        return out;
    }
    vector<int> postorder() const {                       // reverse of node, right, left
        vector<int> out;
        vector<Node*> st;
        if (root) st.push_back(root);
        while (!st.empty()) {
            Node* n = st.back(); st.pop_back();
            out.push_back(n->val);
            if (n->left) st.push_back(n->left);
            if (n->right) st.push_back(n->right);
        }
        reverse(out.begin(), out.end());
        return out;
    }
    vector<vector<int>> levelOrder() const {              // BFS, one row per depth
        vector<vector<int>> out;
        queue<Node*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            out.emplace_back();
            for (int k = q.size(); k > 0; k--) {
                Node* n = q.front(); q.pop();
                out.back().push_back(n->val);
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
        }
        return out;
    }
};
// @test
    BST t;
    for (int k : {50, 30, 70, 20, 40, 60, 80, 35, 45, 65}) t.insert(k);
    H::check(t.inorder(), vector<int>{20, 30, 35, 40, 45, 50, 60, 65, 70, 80}, "inorder is sorted");
    H::check(t.preorder(), vector<int>{50, 30, 20, 40, 35, 45, 70, 60, 65, 80}, "preorder");
    H::check(t.postorder(), vector<int>{20, 35, 45, 40, 30, 65, 60, 80, 70, 50}, "postorder");
    H::check(t.levelOrder(), vector<vector<int>>{{50}, {30, 70}, {20, 40, 60, 80}, {35, 45, 65}}, "level order");
    H::check(t.search(45), true, "search hit");
    H::check(t.search(46), false, "search miss");
    H::check(t.height(), 3, "height");
    H::check(t.insert(40), false, "duplicate refused");
    H::check(t.erase(20), true, "delete leaf");
    H::check(t.erase(60), true, "delete one child");
    H::check(t.erase(50), true, "delete two children");
    H::check(t.erase(99), false, "delete missing");
    H::check(t.levelOrder(), vector<vector<int>>{{65}, {30, 70}, {40, 80}, {35, 45}}, "shape after deletes");
    H::check(t.size(), 7, "size");
    BST chain;
    for (int k = 1; k <= 7; k++) chain.insert(k);
    H::check(chain.height(), 6, "sorted inserts make a chain");
