class Node {
public:
    int val;
    Node* next;
    Node* random;
    Node(int _val) { val = _val; next = NULL; random = NULL; }
};

class Solution {
public:
    Node* copyRandomList(Node* head) {
        unordered_map<Node*, Node*> copy = {{nullptr, nullptr}};   // original to copy
        for (Node* cur = head; cur; cur = cur->next) copy[cur] = new Node(cur->val);
        for (Node* cur = head; cur; cur = cur->next) {   // second pass: every copy now exists
            copy[cur]->next = copy[cur->next];
            copy[cur]->random = copy[cur->random];
        }
        return copy[head];
    }
};
// @test
    const int NONE = -1;
    for (vector<pair<int, int>> spec : {vector<pair<int, int>>{{7, NONE}, {13, 0}, {11, 4}, {10, 2}, {1, 0}},
                                        vector<pair<int, int>>{{1, 1}, {2, 1}}, vector<pair<int, int>>{{3, NONE}, {3, 0}, {3, NONE}}}) {
        vector<Node*> nodes;
        for (auto [v, r] : spec) nodes.push_back(new Node(v));
        for (size_t i = 0; i < spec.size(); i++) {
            nodes[i]->next = i + 1 < nodes.size() ? nodes[i + 1] : nullptr;
            nodes[i]->random = spec[i].second == NONE ? nullptr : nodes[spec[i].second];
        }
        vector<Node*> seen;
        for (Node* c = Solution().copyRandomList(nodes[0]); c; c = c->next) seen.push_back(c);
        vector<pair<int, int>> out;
        bool shared = false;
        for (Node* c : seen) {
            int r = c->random ? (int)(find(seen.begin(), seen.end(), c->random) - seen.begin()) : NONE;
            out.push_back({c->val, r});
            if (find(nodes.begin(), nodes.end(), c) != nodes.end()) shared = true;
        }
        H::check(out, spec, "copyRandomList");
        H::check(shared, false, "copyRandomList makes new nodes");
    }
    H::check(Solution().copyRandomList(nullptr) == nullptr, true, "copyRandomList empty");
