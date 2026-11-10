// C++ templates for the DSA revision sheet. Each `code` is shown on the page; check:other compiles `code` + `test` with
// -std=c++20 -Wall -Werror and requires the test to print "ok". Keep every snippet self-contained (its own includes).
export type CppTemplate = { id: string; title: string; when: string; cost: string; code: string; test: string };

export const CPP_TEMPLATES: CppTemplate[] = [
  {
    "id": "skeleton",
    "title": "Fast input and output",
    "when": "Every contest or OA submission that reads input",
    "cost": "O(n)",
    "code": "#include <iostream>\n#include <vector>\nusing namespace std;\nusing ll = long long;\nconst ll MOD = 1'000'000'007;\n\nint solve() {                         // in a contest, this is main()\n    ios::sync_with_stdio(false);      // fast cin/cout; do not mix with scanf/printf after this\n    cin.tie(nullptr);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<ll> a(n);\n    for (auto& x : a) cin >> x;\n    ll sum = 0;\n    for (ll x : a) sum = (sum + x) % MOD;\n    cout << sum << '\\n';              // '\\n', not endl: endl flushes on every line\n    return 0;\n}",
    "test": "#include <cassert>\n#include <sstream>\nint main() {\n    ios::sync_with_stdio(false);      // on GCC this swaps the stream buffers, so do it before redirecting them\n    istringstream in(\"3\\n1 2 3\\n\");\n    cin.rdbuf(in.rdbuf());\n    ostringstream out;\n    auto* old = cout.rdbuf(out.rdbuf());\n    solve();\n    cout.rdbuf(old);\n    assert(out.str() == \"6\\n\");\n    cout << \"ok\\n\";\n}"
  },
  {
    "id": "binary-search",
    "title": "Binary search on the answer",
    "when": "\"Minimum capacity / speed / time such that ...\": the answer is monotonic",
    "cost": "O(n log range)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\n// smallest x in [lo, hi] with ok(x) true, where ok is false ... false, true ... true\ntemplate <class F> long long firstTrue(long long lo, long long hi, F ok) {\n    while (lo < hi) {\n        long long mid = lo + (hi - lo) / 2;          // never overflows, unlike (lo + hi) / 2\n        if (ok(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}\n\n// least ship capacity that delivers every package within d days (LeetCode 1011)\nlong long shipWithinDays(const vector<int>& w, int d) {\n    long long lo = 0, hi = 0;\n    for (int x : w) { lo = max<long long>(lo, x); hi += x; }\n    return firstTrue(lo, hi, [&](long long cap) {\n        int days = 1;\n        long long load = 0;\n        for (int x : w) { if (load + x > cap) { days++; load = 0; } load += x; }\n        return days <= d;\n    });\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(shipWithinDays({1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, 5) == 15);\n    assert(firstTrue(0, 100, [](long long x) { return x * x >= 50; }) == 8);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "two-pointers",
    "title": "Sliding window and two pointers",
    "when": "Longest/shortest substring or subarray with a condition; pair sums in sorted arrays",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint longestUnique(const string& s) {             // the window [l, r] never holds a repeat\n    vector<int> last(256, -1);\n    int best = 0;\n    for (int l = 0, r = 0; r < (int)s.size(); r++) {\n        unsigned char c = s[r];\n        if (last[c] >= l) l = last[c] + 1;         // jump past the earlier copy\n        last[c] = r;\n        best = max(best, r - l + 1);\n    }\n    return best;\n}\n\nbool hasPairSum(const vector<int>& a, int target) {   // a must be sorted\n    int i = 0, j = (int)a.size() - 1;\n    while (i < j) {\n        int s = a[i] + a[j];\n        if (s == target) return true;\n        if (s < target) i++; else j--;             // move the pointer that can fix the gap\n    }\n    return false;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(longestUnique(\"abcabcbb\") == 3 && longestUnique(\"bbbbb\") == 1 && longestUnique(\"pwwkew\") == 3);\n    assert(hasPairSum({1, 2, 4, 7, 11}, 15) && !hasPairSum({1, 2, 4, 7, 11}, 10));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "kadane-intervals",
    "title": "Kadane and merging intervals",
    "when": "Maximum subarray sum; overlapping meetings or ranges",
    "cost": "O(n) and O(n log n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nlong long maxSubarray(const vector<int>& a) {      // Kadane: best sum ending here, or start fresh\n    long long best = a[0], cur = 0;\n    for (int x : a) {\n        cur = max<long long>(x, cur + x);\n        best = max(best, cur);\n    }\n    return best;                                     // works when every number is negative\n}\n\nvector<pair<int, int>> mergeIntervals(vector<pair<int, int>> v) {\n    sort(v.begin(), v.end());                        // by start, then end\n    vector<pair<int, int>> out;\n    for (auto [s, e] : v) {\n        if (!out.empty() && s <= out.back().second) out.back().second = max(out.back().second, e);\n        else out.push_back({s, e});\n    }\n    return out;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(maxSubarray({-2, 1, -3, 4, -1, 2, 1, -5, 4}) == 6 && maxSubarray({-3, -1, -2}) == -1);\n    assert(mergeIntervals({{8, 10}, {1, 3}, {2, 6}, {15, 18}}) == (vector<pair<int, int>>{{1, 6}, {8, 10}, {15, 18}}));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "prefix",
    "title": "Prefix sums, 1D and 2D",
    "when": "Many range-sum queries; counting subarrays with sum k",
    "cost": "O(n) build, O(1) per query",
    "code": "#include <unordered_map>\n#include <vector>\nusing namespace std;\n\nint subarraySum(const vector<int>& a, int k) {   // number of subarrays summing to k\n    unordered_map<long long, int> seen{{0, 1}};\n    long long run = 0;\n    int count = 0;\n    for (int x : a) {\n        run += x;\n        auto it = seen.find(run - k);\n        if (it != seen.end()) count += it->second;\n        seen[run]++;\n    }\n    return count;\n}\n\nstruct Prefix2D {                                // sum of any rectangle in O(1)\n    vector<vector<long long>> p;\n    explicit Prefix2D(const vector<vector<int>>& g) : p(g.size() + 1, vector<long long>(g[0].size() + 1, 0)) {\n        for (size_t i = 0; i < g.size(); i++)\n            for (size_t j = 0; j < g[0].size(); j++)\n                p[i + 1][j + 1] = g[i][j] + p[i][j + 1] + p[i + 1][j] - p[i][j];\n    }\n    long long sum(int r1, int c1, int r2, int c2) const {   // corners included\n        return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];\n    }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(subarraySum({1, 1, 1}, 2) == 2 && subarraySum({1, 2, 3}, 3) == 2);\n    Prefix2D p({{1, 2}, {3, 4}});\n    assert(p.sum(0, 0, 1, 1) == 10 && p.sum(1, 0, 1, 1) == 7);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "mono-stack",
    "title": "Monotonic stack",
    "when": "Next greater or smaller element, histogram areas, stock spans",
    "cost": "O(n)",
    "code": "#include <stack>\n#include <vector>\nusing namespace std;\n\nvector<int> nextGreater(const vector<int>& a) {  // -1 when there is none\n    vector<int> res(a.size(), -1);\n    stack<int> st;                                 // indexes still waiting for a bigger value\n    for (int i = 0; i < (int)a.size(); i++) {\n        while (!st.empty() && a[st.top()] < a[i]) { res[st.top()] = a[i]; st.pop(); }\n        st.push(i);                                // each index is pushed and popped once\n    }\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(nextGreater({2, 1, 2, 4, 3}) == vector<int>({4, 2, 4, -1, -1}));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "mono-deque",
    "title": "Sliding window maximum (monotonic deque)",
    "when": "Max or min of every window of size k",
    "cost": "O(n)",
    "code": "#include <deque>\n#include <vector>\nusing namespace std;\n\nvector<int> windowMax(const vector<int>& a, int k) {\n    deque<int> dq;                                 // indexes, values decreasing front to back\n    vector<int> res;\n    for (int i = 0; i < (int)a.size(); i++) {\n        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();       // fell out of the window\n        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();   // can never be the max again\n        dq.push_back(i);\n        if (i >= k - 1) res.push_back(a[dq.front()]);\n    }\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(windowMax({1, 3, -1, -3, 5, 3, 6, 7}, 3) == vector<int>({3, 3, 5, 5, 6, 7}));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "linked-list",
    "title": "Linked list: reverse, middle, cycle",
    "when": "Reverse a list or part of it, find the middle, detect a cycle",
    "cost": "O(n), O(1) space",
    "code": "struct ListNode {\n    int val;\n    ListNode* next;\n    explicit ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}\n};\n\nListNode* reverseList(ListNode* head) {\n    ListNode* prev = nullptr;\n    while (head) {\n        ListNode* next = head->next;               // save, point back, move on\n        head->next = prev;\n        prev = head;\n        head = next;\n    }\n    return prev;\n}\n\nListNode* middle(ListNode* head) {               // slow moves 1, fast moves 2\n    ListNode *slow = head, *fast = head;\n    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }\n    return slow;                                   // second middle for even lengths\n}\n\nbool hasCycle(ListNode* head) {                  // Floyd: fast catches slow inside a cycle\n    ListNode *slow = head, *fast = head;\n    while (fast && fast->next) {\n        slow = slow->next; fast = fast->next->next;\n        if (slow == fast) return true;\n    }\n    return false;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    ListNode e(5), d(4, &e), c(3, &d), b(2, &c), a(1, &b);\n    assert(middle(&a)->val == 3 && !hasCycle(&a));\n    ListNode* r = reverseList(&a);\n    assert(r->val == 5 && r->next->val == 4 && a.next == nullptr);\n    reverseList(r);\n    e.next = &c;\n    assert(hasCycle(&a));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "grid-bfs",
    "title": "BFS on a grid",
    "when": "Fewest steps in a maze or grid, multi-source spreading (rotting oranges)",
    "cost": "O(rows x cols)",
    "code": "#include <queue>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint shortestPath(const vector<string>& g) {      // steps from top-left to bottom-right through '.', or -1\n    int R = g.size(), C = g[0].size();\n    if (g[0][0] == '#') return -1;\n    vector<vector<int>> dist(R, vector<int>(C, -1));\n    queue<pair<int, int>> q;\n    q.push({0, 0});\n    dist[0][0] = 0;\n    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};\n    while (!q.empty()) {\n        auto [r, c] = q.front(); q.pop();\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= R || nc < 0 || nc >= C || g[nr][nc] == '#' || dist[nr][nc] != -1) continue;\n            dist[nr][nc] = dist[r][c] + 1;           // mark when pushed, not when popped\n            q.push({nr, nc});\n        }\n    }\n    return dist[R - 1][C - 1];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(shortestPath({\"..#\", \"#..\", \"...\"}) == 4);\n    assert(shortestPath({\".#\", \"#.\"}) == -1);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "components",
    "title": "DFS without recursion: connected components",
    "when": "Islands, provinces, groups; large inputs where recursion could overflow the stack",
    "cost": "O(V + E)",
    "code": "#include <vector>\nusing namespace std;\n\nint countComponents(int n, const vector<pair<int, int>>& edges) {\n    vector<vector<int>> adj(n);\n    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }\n    vector<bool> seen(n);\n    int comps = 0;\n    for (int s = 0; s < n; s++) {\n        if (seen[s]) continue;\n        comps++;\n        vector<int> st = {s};                        // an explicit stack instead of recursion\n        seen[s] = true;\n        while (!st.empty()) {\n            int u = st.back(); st.pop_back();\n            for (int v : adj[u]) if (!seen[v]) { seen[v] = true; st.push_back(v); }\n        }\n    }\n    return comps;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(countComponents(5, {{0, 1}, {1, 2}, {3, 4}}) == 2 && countComponents(3, {}) == 3);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "tree",
    "title": "Binary tree: traversals, depth, LCA",
    "when": "Any tree question: inorder without recursion, level order, height, lowest common ancestor",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <queue>\n#include <stack>\n#include <vector>\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode *left = nullptr, *right = nullptr;\n    explicit TreeNode(int v) : val(v) {}\n};\n\nvector<int> inorder(TreeNode* root) {           // iterative: no recursion depth limit\n    vector<int> out;\n    stack<TreeNode*> st;\n    for (TreeNode* t = root; t || !st.empty(); t = t->right) {\n        while (t) { st.push(t); t = t->left; }     // go as far left as possible\n        t = st.top(); st.pop();\n        out.push_back(t->val);\n    }\n    return out;\n}\n\nvector<vector<int>> levelOrder(TreeNode* root) {\n    vector<vector<int>> out;\n    queue<TreeNode*> q;\n    if (root) q.push(root);\n    while (!q.empty()) {\n        out.emplace_back();\n        for (size_t k = q.size(); k > 0; k--) {    // exactly one level per pass\n            TreeNode* t = q.front(); q.pop();\n            out.back().push_back(t->val);\n            if (t->left) q.push(t->left);\n            if (t->right) q.push(t->right);\n        }\n    }\n    return out;\n}\n\nint depth(TreeNode* t) { return t ? 1 + max(depth(t->left), depth(t->right)) : 0; }\n\nTreeNode* lca(TreeNode* t, TreeNode* p, TreeNode* q) {   // any binary tree\n    if (!t || t == p || t == q) return t;\n    TreeNode* l = lca(t->left, p, q);\n    TreeNode* r = lca(t->right, p, q);\n    return l && r ? t : (l ? l : r);               // found on both sides: t is the answer\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    TreeNode n4(4), n5(5), n2(2), n3(3), n1(1);\n    n1.left = &n2; n1.right = &n3; n2.left = &n4; n2.right = &n5;\n    assert(inorder(&n1) == vector<int>({4, 2, 5, 1, 3}));\n    assert(levelOrder(&n1) == (vector<vector<int>>{{1}, {2, 3}, {4, 5}}));\n    assert(depth(&n1) == 3 && lca(&n1, &n4, &n5) == &n2 && lca(&n1, &n4, &n3) == &n1);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "dijkstra",
    "title": "Dijkstra",
    "when": "Shortest paths with non-negative weights (network delay, cheapest route)",
    "cost": "O((V + E) log V)",
    "code": "#include <climits>\n#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<long long> dijkstra(int n, const vector<vector<pair<int, int>>>& adj, int src) {   // adj[u] = {(v, w)}\n    vector<long long> dist(n, LLONG_MAX);\n    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;   // min-heap\n    dist[src] = 0;\n    pq.push({0, src});\n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        if (d > dist[u]) continue;                   // stale entry: a shorter one was already used\n        for (auto [v, w] : adj[u])\n            if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }\n    }\n    return dist;                                     // LLONG_MAX: unreachable\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<vector<pair<int, int>>> adj(5);\n    adj[0] = {{1, 4}, {2, 1}}; adj[2] = {{1, 2}, {3, 5}}; adj[1] = {{3, 1}}; adj[3] = {{4, 3}};\n    assert(dijkstra(5, adj, 0) == vector<long long>({0, 3, 1, 4, 7}));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "topo",
    "title": "Topological sort (Kahn) and cycle check",
    "when": "Course schedule, build order, any \"A before B\" constraints",
    "cost": "O(V + E)",
    "code": "#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<int> topoSort(int n, const vector<pair<int, int>>& edges) {   // empty result means a cycle\n    vector<vector<int>> adj(n);\n    vector<int> indeg(n, 0);\n    for (auto [u, v] : edges) { adj[u].push_back(v); indeg[v]++; }\n    queue<int> q;\n    for (int u = 0; u < n; u++) if (indeg[u] == 0) q.push(u);\n    vector<int> order;\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        order.push_back(u);\n        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);\n    }\n    if ((int)order.size() < n) order.clear();\n    return order;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<pair<int, int>> e = {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}};\n    assert(topoSort(6, e) == vector<int>({4, 5, 2, 0, 3, 1}));\n    e.push_back({1, 5});\n    assert(topoSort(6, e).empty());\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "dsu",
    "title": "Union-find and Kruskal's MST",
    "when": "Dynamic connectivity, redundant edge, minimum spanning tree",
    "cost": "Almost O(1) per operation; Kruskal O(E log E)",
    "code": "#include <algorithm>\n#include <array>\n#include <numeric>\n#include <vector>\nusing namespace std;\n\nstruct DSU {\n    vector<int> parent, size;\n    explicit DSU(int n) : parent(n), size(n, 1) { iota(parent.begin(), parent.end(), 0); }\n    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }   // path compression\n    bool unite(int a, int b) {\n        a = find(a); b = find(b);\n        if (a == b) return false;                  // already connected: this edge makes a cycle\n        if (size[a] < size[b]) swap(a, b);         // union by size\n        parent[b] = a;\n        size[a] += size[b];\n        return true;\n    }\n};\n\nlong long kruskal(int n, vector<array<int, 3>> edges) {   // edges as {w, u, v}; -1 if not connected\n    sort(edges.begin(), edges.end());\n    DSU d(n);\n    long long total = 0;\n    int used = 0;\n    for (auto [w, u, v] : edges) if (d.unite(u, v)) { total += w; used++; }\n    return used == n - 1 ? total : -1;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    DSU d(6);\n    d.unite(0, 1); d.unite(1, 2); d.unite(3, 4);\n    assert(d.find(0) == d.find(2) && d.find(0) != d.find(3) && !d.unite(2, 0));\n    assert(kruskal(4, {{1, 0, 1}, {4, 1, 2}, {3, 0, 2}, {2, 2, 3}, {5, 1, 3}}) == 6);\n    assert(kruskal(3, {{1, 0, 1}}) == -1);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "floyd",
    "title": "Floyd-Warshall",
    "when": "All-pairs shortest paths for small n (up to about 400)",
    "cost": "O(n^3)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nconst long long INF = 1e18;\n\nvoid floyd(vector<vector<long long>>& d) {        // d[i][j]: edge weight or INF, 0 on the diagonal\n    int n = d.size();\n    for (int k = 0; k < n; k++)                     // k must be the outermost loop\n        for (int i = 0; i < n; i++)\n            for (int j = 0; j < n; j++)\n                if (d[i][k] < INF && d[k][j] < INF) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<vector<long long>> d = {{0, 3, INF}, {INF, 0, 1}, {2, INF, 0}};\n    floyd(d);\n    assert(d[0][2] == 4 && d[2][1] == 5 && d[1][0] == 3);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "segtree",
    "title": "Segment tree (point update, range sum)",
    "when": "Range queries mixed with updates; swap + for min, max or gcd",
    "cost": "O(log n) per operation",
    "code": "#include <vector>\nusing namespace std;\n\nstruct SegTree {                                   // iterative, 0-based, 2n memory\n    int n;\n    vector<long long> t;\n    explicit SegTree(const vector<int>& a) : n(a.size()), t(2 * a.size()) {\n        for (int i = 0; i < n; i++) t[n + i] = a[i];\n        for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];\n    }\n    void update(int i, long long v) {              // a[i] = v\n        for (t[i += n] = v; i > 1; i /= 2) t[i / 2] = t[i] + t[i ^ 1];\n    }\n    long long query(int l, int r) const {          // sum of a[l..r), r excluded\n        long long s = 0;\n        for (l += n, r += n; l < r; l /= 2, r /= 2) {\n            if (l & 1) s += t[l++];\n            if (r & 1) s += t[--r];\n        }\n        return s;\n    }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    SegTree st({1, 3, 5, 7, 9, 11});\n    assert(st.query(1, 4) == 15);\n    st.update(2, 10);\n    assert(st.query(1, 4) == 20 && st.query(0, 6) == 41);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "merge-sort",
    "title": "Merge sort and counting inversions",
    "when": "Stable O(n log n) sort; count pairs i < j with a[i] > a[j]",
    "cost": "O(n log n)",
    "code": "#include <vector>\nusing namespace std;\n\nlong long sortCount(vector<int>& a, int lo, int hi, vector<int>& tmp) {   // sorts a[lo, hi), returns inversions\n    if (hi - lo < 2) return 0;\n    int mid = (lo + hi) / 2;\n    long long inv = sortCount(a, lo, mid, tmp) + sortCount(a, mid, hi, tmp);\n    int i = lo, j = mid, k = lo;\n    while (i < mid || j < hi) {\n        if (j == hi || (i < mid && a[i] <= a[j])) tmp[k++] = a[i++];   // <= keeps it stable\n        else { inv += mid - i; tmp[k++] = a[j++]; }                     // every remaining left value is bigger\n    }\n    for (k = lo; k < hi; k++) a[k] = tmp[k];\n    return inv;\n}\n\nlong long countInversions(vector<int> a) {\n    vector<int> tmp(a.size());\n    return sortCount(a, 0, a.size(), tmp);\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(countInversions({2, 4, 1, 3, 5}) == 3 && countInversions({5, 4, 3, 2, 1}) == 10 && countInversions({1, 2}) == 0);\n    vector<int> v = {5, 1, 4, 2}, tmp(4);\n    sortCount(v, 0, 4, tmp);\n    assert(v == vector<int>({1, 2, 4, 5}));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "fenwick",
    "title": "Fenwick tree (binary indexed tree)",
    "when": "Prefix sums with updates, counting inversions; less code than a segment tree",
    "cost": "O(log n) per operation",
    "code": "#include <vector>\nusing namespace std;\n\nstruct Fenwick {\n    int n;\n    vector<long long> f;\n    explicit Fenwick(int n) : n(n), f(n + 1, 0) {}\n    void add(int i, long long v) { for (i++; i <= n; i += i & -i) f[i] += v; }   // 0-based i\n    long long prefix(int i) const {                // sum of a[0..i]\n        long long s = 0;\n        for (i++; i > 0; i -= i & -i) s += f[i];\n        return s;\n    }\n    long long range(int l, int r) const { return prefix(r) - (l ? prefix(l - 1) : 0); }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    Fenwick fw(6);\n    int a[] = {1, 3, 5, 7, 9, 11};\n    for (int i = 0; i < 6; i++) fw.add(i, a[i]);\n    assert(fw.range(1, 3) == 15 && fw.prefix(5) == 36);\n    fw.add(2, 5);\n    assert(fw.range(1, 3) == 20);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "trie",
    "title": "Trie with a node pool",
    "when": "Prefix search, word dictionaries, autocomplete, XOR tricks on bits",
    "cost": "O(word length)",
    "code": "#include <array>\n#include <string>\n#include <vector>\nusing namespace std;\n\nstruct Trie {                                      // nodes live in vectors: fast and nothing to free\n    vector<array<int, 26>> next{array<int, 26>{}};   // 0 means no child; node 0 is the root\n    vector<bool> word{false};\n    void insert(const string& s) {\n        int u = 0;\n        for (char ch : s) {\n            int c = ch - 'a';\n            if (!next[u][c]) { next[u][c] = next.size(); next.push_back({}); word.push_back(false); }\n            u = next[u][c];\n        }\n        word[u] = true;\n    }\n    int walk(const string& s) const {              // node reached by this prefix, or -1\n        int u = 0;\n        for (char ch : s) { u = next[u][ch - 'a']; if (!u) return -1; }\n        return u;\n    }\n    bool search(const string& s) const { int u = walk(s); return u != -1 && word[u]; }\n    bool startsWith(const string& p) const { return walk(p) != -1; }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    Trie t;\n    for (string w : {\"apple\", \"app\", \"apt\", \"bat\"}) t.insert(w);\n    assert(t.search(\"app\") && !t.search(\"appl\") && t.startsWith(\"ap\") && !t.startsWith(\"c\"));\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "knapsack",
    "title": "Knapsack and coin change",
    "when": "Pick items under a capacity; fewest coins; count ways",
    "cost": "O(n x capacity)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint knapsack(const vector<int>& wt, const vector<int>& val, int cap) {   // each item at most once\n    vector<int> dp(cap + 1, 0);                      // dp[c] = best value within capacity c\n    for (size_t i = 0; i < wt.size(); i++)\n        for (int c = cap; c >= wt[i]; c--)           // backwards, so an item is never reused\n            dp[c] = max(dp[c], dp[c - wt[i]] + val[i]);\n    return dp[cap];\n}\n\nint coinChange(const vector<int>& coins, int amount) {   // unlimited coins: loop forwards\n    const int INF = 1e9;\n    vector<int> dp(amount + 1, INF);\n    dp[0] = 0;\n    for (int a = 1; a <= amount; a++)\n        for (int c : coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n    return dp[amount] >= INF ? -1 : dp[amount];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(knapsack({1, 3, 4, 5}, {1, 4, 5, 7}, 7) == 9);\n    assert(coinChange({1, 2, 5}, 11) == 3 && coinChange({2}, 3) == -1);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "lis",
    "title": "Longest increasing subsequence",
    "when": "LIS, envelopes, stacking boxes",
    "cost": "O(n log n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint lis(const vector<int>& a) {                    // strictly increasing\n    vector<int> tails;                               // tails[k]: smallest end of an increasing run of length k + 1\n    for (int x : a) {\n        auto it = lower_bound(tails.begin(), tails.end(), x);   // upper_bound for non-decreasing\n        if (it == tails.end()) tails.push_back(x); else *it = x;\n    }\n    return tails.size();\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(lis({10, 9, 2, 5, 3, 7, 101, 18}) == 4 && lis({7, 7, 7}) == 1);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "quickselect",
    "title": "Quickselect and top k",
    "when": "K-th largest or smallest; top k frequent",
    "cost": "O(n) average with quickselect, O(n log k) with a heap",
    "code": "#include <algorithm>\n#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nint kthLargest(vector<int> a, int k) {             // nth_element is the library quickselect\n    nth_element(a.begin(), a.begin() + (k - 1), a.end(), greater<int>());\n    return a[k - 1];\n}\n\nint kthLargestHeap(const vector<int>& a, int k) {  // keep the k largest in a min-heap\n    priority_queue<int, vector<int>, greater<int>> pq;\n    for (int x : a) {\n        pq.push(x);\n        if ((int)pq.size() > k) pq.pop();           // drop the smallest of the k + 1\n    }\n    return pq.top();\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(kthLargest({3, 2, 1, 5, 6, 4}, 2) == 5 && kthLargestHeap({3, 2, 3, 1, 2, 4, 5, 5, 6}, 4) == 4);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "string-dp",
    "title": "LCS and edit distance",
    "when": "Comparing two strings: common subsequence, minimum edits",
    "cost": "O(n x m)",
    "code": "#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint lcs(const string& a, const string& b) {\n    vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1, 0));\n    for (size_t i = 1; i <= a.size(); i++)\n        for (size_t j = 1; j <= b.size(); j++)\n            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);\n    return dp[a.size()][b.size()];\n}\n\nint editDistance(const string& a, const string& b) {   // insert, delete or replace one character\n    vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1));\n    for (size_t i = 0; i <= a.size(); i++) dp[i][0] = i;\n    for (size_t j = 0; j <= b.size(); j++) dp[0][j] = j;\n    for (size_t i = 1; i <= a.size(); i++)\n        for (size_t j = 1; j <= b.size(); j++)\n            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] : 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});\n    return dp[a.size()][b.size()];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(lcs(\"abcde\", \"ace\") == 3 && editDistance(\"horse\", \"ros\") == 3 && editDistance(\"\", \"abc\") == 3);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "backtrack",
    "title": "Backtracking: subsets and permutations",
    "when": "Generate all subsets, permutations, combinations; n up to about 10 to 20",
    "cost": "O(2^n) or O(n!)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvoid subsets(const vector<int>& a, size_t i, vector<int>& cur, vector<vector<int>>& out) {\n    if (i == a.size()) { out.push_back(cur); return; }\n    subsets(a, i + 1, cur, out);                     // skip a[i]\n    cur.push_back(a[i]);\n    subsets(a, i + 1, cur, out);                     // take a[i]\n    cur.pop_back();                                  // undo before returning\n}\n\nvector<vector<int>> permutations(vector<int> a) {\n    sort(a.begin(), a.end());                        // next_permutation starts from the smallest order\n    vector<vector<int>> out;\n    do out.push_back(a); while (next_permutation(a.begin(), a.end()));\n    return out;                                      // repeated values give no repeated permutations\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<int> cur;\n    vector<vector<int>> out;\n    subsets({1, 2, 3}, 0, cur, out);\n    assert(out.size() == 8);\n    assert(permutations({1, 1, 2}).size() == 3 && permutations({3, 2, 1}).size() == 6);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "number-theory",
    "title": "Modular power, inverse and nCr",
    "when": "Answers modulo 1e9+7, combinatorics, probabilities as fractions",
    "cost": "O(log e) power; O(n) setup then O(1) nCr",
    "code": "#include <vector>\nusing namespace std;\n\nconst long long MOD = 1'000'000'007;\n\nlong long power(long long b, long long e, long long m = MOD) {\n    long long r = 1;\n    b %= m;\n    for (; e > 0; e >>= 1, b = b * b % m) if (e & 1) r = r * b % m;\n    return r;\n}\n\nlong long inverse(long long a) { return power(a, MOD - 2); }   // Fermat's little theorem: MOD is prime\n\nstruct Binomial {\n    vector<long long> f, inv;\n    explicit Binomial(int n) : f(n + 1), inv(n + 1) {\n        f[0] = 1;\n        for (int i = 1; i <= n; i++) f[i] = f[i - 1] * i % MOD;\n        inv[n] = inverse(f[n]);\n        for (int i = n; i > 0; i--) inv[i - 1] = inv[i] * i % MOD;\n    }\n    long long C(int n, int r) const { return r < 0 || r > n ? 0 : f[n] * inv[r] % MOD * inv[n - r] % MOD; }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(power(2, 10) == 1024 && power(2, 100) == 976371285);\n    assert(inverse(2) * 2 % MOD == 1);\n    Binomial b(1000);\n    assert(b.C(5, 2) == 10 && b.C(10, 0) == 1 && b.C(3, 5) == 0);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "sieve",
    "title": "Sieve of Eratosthenes and gcd",
    "when": "Many primality checks, counting primes, factorising many numbers",
    "cost": "O(n log log n)",
    "code": "#include <numeric>\n#include <vector>\nusing namespace std;\n\nvector<int> primesUpTo(int n) {\n    vector<bool> composite(n + 1, false);\n    vector<int> primes;\n    for (int i = 2; i <= n; i++) {\n        if (composite[i]) continue;\n        primes.push_back(i);\n        for (long long j = (long long)i * i; j <= n; j += i) composite[j] = true;   // start at i * i\n    }\n    return primes;\n}\n\nlong long lcmOf(long long a, long long b) { return a / gcd(a, b) * b; }   // divide first to avoid overflow",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    auto p = primesUpTo(30);\n    assert(p.size() == 10 && p.back() == 29);\n    assert(gcd(12, 18) == 6 && lcmOf(12, 18) == 36);\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "kmp",
    "title": "KMP string matching",
    "when": "Find a pattern in a text in linear time; repeated substrings; shortest palindrome",
    "cost": "O(n + m)",
    "code": "#include <string>\n#include <vector>\nusing namespace std;\n\nvector<int> prefixFunction(const string& s) {      // pi[i]: longest proper prefix of s[0..i] that is also a suffix\n    vector<int> pi(s.size(), 0);\n    for (size_t i = 1; i < s.size(); i++) {\n        int k = pi[i - 1];\n        while (k > 0 && s[i] != s[k]) k = pi[k - 1];\n        if (s[i] == s[k]) k++;\n        pi[i] = k;\n    }\n    return pi;\n}\n\nvector<int> findAll(const string& text, const string& pat) {   // every start index\n    string s = pat + '#' + text;                       // '#' must not occur in either string\n    vector<int> pi = prefixFunction(s), res;\n    for (size_t i = pat.size() + 1; i < s.size(); i++)\n        if (pi[i] == (int)pat.size()) res.push_back(i - 2 * pat.size());\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(findAll(\"abababa\", \"aba\") == vector<int>({0, 2, 4}));\n    assert(findAll(\"aaaa\", \"b\").empty());\n    std::cout << \"ok\\n\";\n}"
  },
  {
    "id": "bits",
    "title": "Bit tricks and submask loops",
    "when": "Bitmask DP, single number (XOR), counting set bits, subsets of a mask",
    "cost": "O(1) per trick; O(3^n) over all submasks",
    "code": "#include <bit>\n#include <vector>\nusing namespace std;\n\nbool isPow2(unsigned x) { return x && !(x & (x - 1)); }     // exactly one bit set\nint lowBit(int x) { return x & -x; }                          // value of the lowest set bit\nint singleNumber(const vector<int>& a) {                      // pairs cancel under XOR\n    int x = 0;\n    for (int v : a) x ^= v;\n    return x;\n}\nvector<int> submasks(int mask) {                              // every subset of mask's bits, largest first\n    vector<int> out;\n    for (int s = mask; s > 0; s = (s - 1) & mask) out.push_back(s);\n    out.push_back(0);\n    return out;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(isPow2(16) && !isPow2(12) && lowBit(12) == 4 && popcount(13u) == 3);\n    assert(singleNumber({4, 1, 2, 1, 2}) == 4);\n    assert(submasks(0b101) == vector<int>({5, 4, 1, 0}));\n    std::cout << \"ok\\n\";\n}"
  }
];
