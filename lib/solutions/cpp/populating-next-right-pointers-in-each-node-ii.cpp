class Node {
public:
    int val;
    Node* left;
    Node* right;
    Node* next;

    Node() : val(0), left(NULL), right(NULL), next(NULL) {}

    Node(int _val) : val(_val), left(NULL), right(NULL), next(NULL) {}

    Node(int _val, Node* _left, Node* _right, Node* _next)
        : val(_val), left(_left), right(_right), next(_next) {}
};

class Solution {
public:
    Node* connect(Node* root) {
        Node* head = root;   // leftmost node of the current level
        while (head) {
            Node dummy(0), *tail = &dummy;   // builds the next level's chain
            for (Node* node = head; node; node = node->next)
                for (Node* child : {node->left, node->right})
                    if (child) { tail->next = child; tail = child; }
            head = dummy.next;
        }
        return root;
    }
};
// @test
    function<Node*(TreeNode*)> conv = [&](TreeNode* t) -> Node* { return t ? new Node(t->val, conv(t->left), conv(t->right), nullptr) : nullptr; };
    auto serial = [](Node* r) {   // values level by level along next pointers, # after each level
        vector<string> out;
        for (Node* lead = r; lead; ) {
            Node* n = lead; lead = nullptr;
            for (; n; n = n->next) {
                out.push_back(to_string(n->val));
                if (!lead) lead = n->left ? n->left : n->right;
            }
            out.push_back("#");
        }
        return out;
    };
    H::check(serial(Solution().connect(conv(H::mkTree({1, 2, 3, 4, 5, NUL, 7})))), vector<string>{"1", "#", "2", "3", "#", "4", "5", "7", "#"}, "connect a");
    H::check(serial(Solution().connect(conv(H::mkTree({1, 2, 3, 4, NUL, NUL, 5, 6, NUL, NUL, 7})))), vector<string>{"1", "#", "2", "3", "#", "4", "5", "#", "6", "7", "#"}, "connect b");
    H::check(Solution().connect(nullptr) == nullptr, true, "connect empty");
