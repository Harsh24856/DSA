class Node {
public:
    int val;
    vector<Node*> children;

    Node() {}

    Node(int _val) {
        val = _val;
    }

    Node(int _val, vector<Node*> _children) {
        val = _val;
        children = _children;
    }
};

class Solution {
public:
    vector<vector<int>> levelOrder(Node* root) {
        vector<vector<int>> out;
        vector<Node*> level;
        if (root) level.push_back(root);
        while (!level.empty()) {
            vector<int> vals;
            vector<Node*> next;
            for (Node* n : level) {
                vals.push_back(n->val);
                next.insert(next.end(), n->children.begin(), n->children.end());
            }
            out.push_back(vals);
            level = move(next);
        }
        return out;
    }
};
// @test
    auto nary = [](vector<int> a) -> Node* {   // LeetCode's serialisation: children groups split by NUL
        if (a.empty()) return nullptr;
        Node* root = new Node(a[0]);
        vector<Node*> q{root};
        size_t i = 2, k = 0;
        while (i < a.size()) {
            Node* parent = q[k++];
            for (; i < a.size() && a[i] != NUL; i++) {
                Node* c = new Node(a[i]);
                parent->children.push_back(c);
                q.push_back(c);
            }
            i++;
        }
        return root;
    };
    H::check(Solution().levelOrder(nary({1, NUL, 3, 2, 4, NUL, 5, 6})), vector<vector<int>>{{1}, {3, 2, 4}, {5, 6}}, "levelOrder a");
    H::check(Solution().levelOrder(nary({1, NUL, 2, 3, 4, 5, NUL, NUL, 6, 7, NUL, 8, NUL, 9, 10, NUL, NUL, 11, NUL, 12, NUL, 13, NUL, NUL, 14})),
             vector<vector<int>>{{1}, {2, 3, 4, 5}, {6, 7, 8, 9, 10}, {11, 12, 13}, {14}}, "levelOrder b");
    H::check(Solution().levelOrder(nullptr), vector<vector<int>>{}, "levelOrder empty");
