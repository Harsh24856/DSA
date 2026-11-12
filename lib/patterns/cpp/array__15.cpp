// segment tree: node covers a[lo..hi] and stores its sum; children are 2*node (left half) and 2*node+1
class SegTree {
    int n;
    vector<long long> t;
    void build(const vector<int>& a, int node, int lo, int hi) {
        if (lo == hi) { t[node] = a[lo]; return; }
        int mid = (lo + hi) / 2;
        build(a, 2 * node, lo, mid);
        build(a, 2 * node + 1, mid + 1, hi);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
    void update(int i, long long v, int node, int lo, int hi) {
        if (lo == hi) { t[node] = v; return; }
        int mid = (lo + hi) / 2;
        if (i <= mid) update(i, v, 2 * node, lo, mid);
        else update(i, v, 2 * node + 1, mid + 1, hi);
        t[node] = t[2 * node] + t[2 * node + 1];          // recompute on the way back up
    }
    long long query(int l, int r, int node, int lo, int hi) const {
        if (r < lo || hi < l) return 0;                   // disjoint: contributes nothing
        if (l <= lo && hi <= r) return t[node];           // fully inside: use the stored sum
        int mid = (lo + hi) / 2;
        return query(l, r, 2 * node, lo, mid) + query(l, r, 2 * node + 1, mid + 1, hi);
    }
public:
    explicit SegTree(const vector<int>& a) : n(a.size()), t(4 * max<size_t>(1, a.size()), 0) {
        if (n) build(a, 1, 0, n - 1);
    }
    void update(int i, long long v) { update(i, v, 1, 0, n - 1); }        // a[i] = v
    long long query(int l, int r) const { return query(l, r, 1, 0, n - 1); }   // sum of a[l..r]
};
// @test
    vector<int> a{5, 2, 9, -3, 5, 20, 10};
    SegTree st(a);
    H::check(st.query(0, 6), 48LL, "whole array");
    H::check(st.query(2, 4), 11LL, "middle");
    H::check(st.query(5, 5), 20LL, "one cell");
    st.update(3, 7); a[3] = 7;
    H::check(st.query(2, 4), 21LL, "after an update");
    int bad = 0;
    for (int l = 0; l < 7; l++)
        for (int r = l; r < 7; r++)
            if (st.query(l, r) != accumulate(a.begin() + l, a.begin() + r + 1, 0LL)) bad++;
    H::check(bad, 0, "every range matches a brute-force sum");
