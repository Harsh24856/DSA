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
        Node* leftmost = root;
        while (leftmost && leftmost->left) {                 // wire the level below this one
            for (Node* node = leftmost; node; node = node->next) {
                node->left->next = node->right;              // siblings
                if (node->next) node->right->next = node->next->left;   // across to the next parent
            }
            leftmost = leftmost->left;
        }
        return root;
    }
};
// @test
    vector<Node*> n(8);
    for (int i = 1; i <= 7; i++) n[i] = new Node(i);
    for (int i = 1; i <= 3; i++) { n[i]->left = n[2 * i]; n[i]->right = n[2 * i + 1]; }
    Node* r = Solution().connect(n[1]);
    vector<int> out;                                         // -1 marks the end of a level
    for (Node* row = r; row; row = row->left) {
        for (Node* x = row; x; x = x->next) out.push_back(x->val);
        out.push_back(-1);
    }
    H::check(out, vector<int>{1, -1, 2, 3, -1, 4, 5, 6, 7, -1}, "connect");
    H::check(Solution().connect(nullptr) == nullptr, true, "connect empty");
