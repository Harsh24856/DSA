class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() { val = 0; neighbors = vector<Node*>(); }
    Node(int _val) { val = _val; neighbors = vector<Node*>(); }
    Node(int _val, vector<Node*> _neighbors) { val = _val; neighbors = _neighbors; }
};

class Solution {
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        unordered_map<Node*, Node*> copies = {{node, new Node(node->val)}};   // original to copy
        vector<Node*> stack = {node};
        while (!stack.empty()) {
            Node* u = stack.back(); stack.pop_back();
            for (Node* v : u->neighbors) {
                if (!copies.count(v)) {                  // first visit: make its copy
                    copies[v] = new Node(v->val);
                    stack.push_back(v);
                }
                copies[u]->neighbors.push_back(copies[v]);
            }
        }
        return copies[node];
    }
};
// @test
    for (vector<vector<int>> adj : {vector<vector<int>>{{2, 4}, {1, 3}, {2, 4}, {1, 3}}, vector<vector<int>>{{}}}) {
        vector<Node*> ns;
        for (size_t i = 0; i < adj.size(); i++) ns.push_back(new Node(i + 1));
        for (size_t i = 0; i < adj.size(); i++) for (int j : adj[i]) ns[i]->neighbors.push_back(ns[j - 1]);
        Node* c = Solution().cloneGraph(ns[0]);
        map<int, vector<int>> out;                       // walk the copy: neighbours by value
        bool shared = false;
        vector<Node*> st = {c};
        while (!st.empty()) {
            Node* u = st.back(); st.pop_back();
            if (out.count(u->val)) continue;
            if (find(ns.begin(), ns.end(), u) != ns.end()) shared = true;
            for (Node* v : u->neighbors) { out[u->val].push_back(v->val); st.push_back(v); }
            out[u->val];
        }
        vector<vector<int>> got;
        for (auto& [k, v] : out) got.push_back(v);
        H::check(got, adj, "cloneGraph");
        H::check(shared, false, "cloneGraph makes new nodes");
    }
    H::check(Solution().cloneGraph(nullptr) == nullptr, true, "cloneGraph empty");
