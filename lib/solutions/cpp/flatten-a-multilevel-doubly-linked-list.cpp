class Node {
public:
    int val;
    Node* prev;
    Node* next;
    Node* child;
};

class Solution {
public:
    Node* flatten(Node* head) {
        if (!head) return head;
        vector<Node*> st{head};
        Node* prev = nullptr;
        while (!st.empty()) {
            Node* node = st.back(); st.pop_back();
            if (prev) { prev->next = node; node->prev = prev; }
            if (node->next) st.push_back(node->next);  // pushed first, so the child comes out first
            if (node->child) { st.push_back(node->child); node->child = nullptr; }
            prev = node;
        }
        return head;
    }
};
// @test
    // LeetCode's multilevel format: levels separated by nulls; k nulls put the next level under node k - 1
    auto multi = [](vector<int> a) {
        Node* head = nullptr;
        vector<Node*> row;
        size_t i = 0;
        while (i < a.size()) {
            int nulls = 0;
            while (i < a.size() && a[i] == NUL) { nulls++; i++; }
            vector<Node*> level;
            while (i < a.size() && a[i] != NUL) level.push_back(new Node{a[i++], nullptr, nullptr, nullptr});
            for (size_t j = 0; j + 1 < level.size(); j++) { level[j]->next = level[j + 1]; level[j + 1]->prev = level[j]; }
            if (!head) head = level[0];
            else row[nulls - 1]->child = level[0];
            row = level;
        }
        return head;
    };
    auto flat = [](Node* h) {
        vector<int> out;
        Node* prev = nullptr;
        for (; h; prev = h, h = h->next) {
            if (h->prev != prev || h->child) return vector<int>{-1};   // broken links
            out.push_back(h->val);
        }
        return out;
    };
    H::check(flat(Solution().flatten(multi({1, 2, 3, 4, 5, 6, NUL, NUL, NUL, 7, 8, 9, 10, NUL, NUL, 11, 12}))), vector<int>{1, 2, 3, 7, 8, 11, 12, 9, 10, 4, 5, 6}, "a");
    H::check(flat(Solution().flatten(multi({1, 2, NUL, 3}))), vector<int>{1, 3, 2}, "b");
    H::check(Solution().flatten(nullptr) == nullptr, true, "empty");
