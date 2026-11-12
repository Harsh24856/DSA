class Solution {
    int find(vector<int>& p, int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
    int unite(vector<int>& p, int a, int b) {            // 1 if it joined two parts
        int ra = find(p, a), rb = find(p, b);
        if (ra == rb) return 0;
        p[ra] = rb;
        return 1;
    }

public:
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        vector<int> alice(n + 1), bob(n + 1);
        iota(alice.begin(), alice.end(), 0);
        iota(bob.begin(), bob.end(), 0);
        sort(edges.rbegin(), edges.rend());              // shared (type 3) edges first
        int used = 0, ja = 0, jb = 0;
        for (auto& e : edges) {
            int t = e[0], u = e[1], v = e[2];
            if (t == 3) {
                int got = unite(alice, u, v);
                unite(bob, u, v);
                used += got; ja += got; jb += got;
            } else if (t == 1) {
                int got = unite(alice, u, v);
                used += got; ja += got;
            } else {
                int got = unite(bob, u, v);
                used += got; jb += got;
            }
        }
        return ja == n - 1 && jb == n - 1 ? (int)edges.size() - used : -1;
    }
};
