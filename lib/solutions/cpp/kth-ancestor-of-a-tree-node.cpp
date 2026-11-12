class TreeAncestor {
    vector<vector<int>> up;                                  // up[j][v] = 2^j-th ancestor of v, or -1
public:
    TreeAncestor(int n, vector<int>& parent) {
        up.push_back(parent);
        for (int j = 1; (1 << j) <= n; j++) {
            vector<int>& prev = up.back();
            vector<int> row(n);
            for (int v = 0; v < n; v++) row[v] = prev[v] == -1 ? -1 : prev[prev[v]];
            up.push_back(row);
        }
    }

    int getKthAncestor(int node, int k) {
        for (int j = 0; k && node != -1; j++, k >>= 1)
            if (k & 1) node = up[j][node];
        return node;
    }
};
// @test
    vector<int> p1 = {-1, 0, 0, 1, 1, 2, 2};
    TreeAncestor t1(7, p1);
    H::check(vector<int>{t1.getKthAncestor(3, 1), t1.getKthAncestor(5, 2), t1.getKthAncestor(6, 3)}, vector<int>{1, 0, -1}, "TreeAncestor");
    vector<int> p2 = {-1, 0, 0, 1, 3, 4, 5, 6, 2};
    TreeAncestor t2(9, p2);
    H::check(vector<int>{t2.getKthAncestor(7, 5), t2.getKthAncestor(8, 3), t2.getKthAncestor(7, 6), t2.getKthAncestor(7, 7), t2.getKthAncestor(0, 1)}, vector<int>{1, -1, 0, -1, -1}, "TreeAncestor chain");
    vector<int> p3 = {-1};
    TreeAncestor t3(1, p3);
    H::check(t3.getKthAncestor(0, 1), -1, "TreeAncestor single");
