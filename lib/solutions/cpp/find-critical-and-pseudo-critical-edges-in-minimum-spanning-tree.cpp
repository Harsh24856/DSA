class Solution {
    int n;
    vector<vector<int>> edges;
    vector<int> order;

    // MST weight skipping one edge or forcing one in first; INT_MAX if the graph stays split
    int mst(int skip = -1, int force = -1) {
        vector<int> parent(n);
        iota(parent.begin(), parent.end(), 0);
        auto find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        int total = 0, joined = 0;
        if (force >= 0) {
            parent[find(edges[force][0])] = find(edges[force][1]);
            total = edges[force][2]; joined = 1;
        }
        for (int i : order) {
            if (i == skip) continue;
            int ra = find(edges[i][0]), rb = find(edges[i][1]);
            if (ra != rb) { parent[ra] = rb; total += edges[i][2]; joined++; }
        }
        return joined == n - 1 ? total : INT_MAX;
    }

public:
    vector<vector<int>> findCriticalAndPseudoCriticalEdges(int n, vector<vector<int>>& edges) {
        this->n = n; this->edges = edges;
        order.resize(edges.size());
        iota(order.begin(), order.end(), 0);
        stable_sort(order.begin(), order.end(), [&](int a, int b) { return edges[a][2] < edges[b][2]; });
        int base = mst();
        vector<int> critical, pseudo;
        for (int i = 0; i < (int)edges.size(); i++) {
            if (mst(i) > base) critical.push_back(i);           // without it the MST costs more
            else if (mst(-1, i) == base) pseudo.push_back(i);   // some MST can use it
        }
        return {critical, pseudo};
    }
};
