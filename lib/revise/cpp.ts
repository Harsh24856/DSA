// C++ templates for the DSA revision sheet, grouped by pattern topic (`topics`: topic ids from lib/patterns, or "setup").
// check:other compiles `code` + `test` with -std=c++20 -Wall -Werror and requires the test to print "ok". Keep every
// snippet self-contained (its own includes). All of them also pass on GCC 15.
export type CppTemplate = { id: string; title: string; when: string; cost: string; topics: string[]; code: string; test: string };

export const CPP_TEMPLATES: CppTemplate[] = [
  {
    "id": "skeleton",
    "title": "Fast input and output",
    "when": "Every contest or OA submission that reads input",
    "cost": "O(n)",
    "code": "#include <iostream>\n#include <vector>\nusing namespace std;\nusing ll = long long;\nconst ll MOD = 1'000'000'007;\n\nint solve() {                         // in a contest, this is main()\n    ios::sync_with_stdio(false);      // fast cin/cout; do not mix with scanf/printf after this\n    cin.tie(nullptr);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<ll> a(n);\n    for (auto& x : a) cin >> x;\n    ll sum = 0;\n    for (ll x : a) sum = (sum + x) % MOD;\n    cout << sum << '\\n';              // '\\n', not endl: endl flushes on every line\n    return 0;\n}",
    "test": "#include <cassert>\n#include <sstream>\nint main() {\n    ios::sync_with_stdio(false);      // on GCC this swaps the stream buffers, so do it before redirecting them\n    istringstream in(\"3\\n1 2 3\\n\");\n    cin.rdbuf(in.rdbuf());\n    ostringstream out;\n    auto* old = cout.rdbuf(out.rdbuf());\n    solve();\n    cout.rdbuf(old);\n    assert(out.str() == \"6\\n\");\n    cout << \"ok\\n\";\n}",
    "topics": [
      "setup"
    ]
  },
  {
    "id": "binary-search",
    "title": "Binary search on the answer",
    "when": "\"Minimum capacity / speed / time such that ...\": the answer is monotonic",
    "cost": "O(n log range)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\n// smallest x in [lo, hi] with ok(x) true, where ok is false ... false, true ... true\ntemplate <class F> long long firstTrue(long long lo, long long hi, F ok) {\n    while (lo < hi) {\n        long long mid = lo + (hi - lo) / 2;          // never overflows, unlike (lo + hi) / 2\n        if (ok(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}\n\n// least ship capacity that delivers every package within d days (LeetCode 1011)\nlong long shipWithinDays(const vector<int>& w, int d) {\n    long long lo = 0, hi = 0;\n    for (int x : w) { lo = max<long long>(lo, x); hi += x; }\n    return firstTrue(lo, hi, [&](long long cap) {\n        int days = 1;\n        long long load = 0;\n        for (int x : w) { if (load + x > cap) { days++; load = 0; } load += x; }\n        return days <= d;\n    });\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(shipWithinDays({1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, 5) == 15);\n    assert(firstTrue(0, 100, [](long long x) { return x * x >= 50; }) == 8);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array"
    ]
  },
  {
    "id": "two-pointers",
    "title": "Sliding window and two pointers",
    "when": "Longest/shortest substring or subarray with a condition; pair sums in sorted arrays",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint longestUnique(const string& s) {             // the window [l, r] never holds a repeat\n    vector<int> last(256, -1);\n    int best = 0;\n    for (int l = 0, r = 0; r < (int)s.size(); r++) {\n        unsigned char c = s[r];\n        if (last[c] >= l) l = last[c] + 1;         // jump past the earlier copy\n        last[c] = r;\n        best = max(best, r - l + 1);\n    }\n    return best;\n}\n\nbool hasPairSum(const vector<int>& a, int target) {   // a must be sorted\n    int i = 0, j = (int)a.size() - 1;\n    while (i < j) {\n        int s = a[i] + a[j];\n        if (s == target) return true;\n        if (s < target) i++; else j--;             // move the pointer that can fix the gap\n    }\n    return false;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(longestUnique(\"abcabcbb\") == 3 && longestUnique(\"bbbbb\") == 1 && longestUnique(\"pwwkew\") == 3);\n    assert(hasPairSum({1, 2, 4, 7, 11}, 15) && !hasPairSum({1, 2, 4, 7, 11}, 10));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "string"
    ]
  },
  {
    "id": "kadane-intervals",
    "title": "Kadane and merging intervals",
    "when": "Maximum subarray sum; overlapping meetings or ranges",
    "cost": "O(n) and O(n log n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nlong long maxSubarray(const vector<int>& a) {      // Kadane: best sum ending here, or start fresh\n    long long best = a[0], cur = 0;\n    for (int x : a) {\n        cur = max<long long>(x, cur + x);\n        best = max(best, cur);\n    }\n    return best;                                     // works when every number is negative\n}\n\nvector<pair<int, int>> mergeIntervals(vector<pair<int, int>> v) {\n    sort(v.begin(), v.end());                        // by start, then end\n    vector<pair<int, int>> out;\n    for (auto [s, e] : v) {\n        if (!out.empty() && s <= out.back().second) out.back().second = max(out.back().second, e);\n        else out.push_back({s, e});\n    }\n    return out;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(maxSubarray({-2, 1, -3, 4, -1, 2, 1, -5, 4}) == 6 && maxSubarray({-3, -1, -2}) == -1);\n    assert(mergeIntervals({{8, 10}, {1, 3}, {2, 6}, {15, 18}}) == (vector<pair<int, int>>{{1, 6}, {8, 10}, {15, 18}}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "intervals"
    ]
  },
  {
    "id": "prefix",
    "title": "Prefix sums, 1D and 2D",
    "when": "Many range-sum queries; counting subarrays with sum k",
    "cost": "O(n) build, O(1) per query",
    "code": "#include <unordered_map>\n#include <vector>\nusing namespace std;\n\nint subarraySum(const vector<int>& a, int k) {   // number of subarrays summing to k\n    unordered_map<long long, int> seen{{0, 1}};\n    long long run = 0;\n    int count = 0;\n    for (int x : a) {\n        run += x;\n        auto it = seen.find(run - k);\n        if (it != seen.end()) count += it->second;\n        seen[run]++;\n    }\n    return count;\n}\n\nstruct Prefix2D {                                // sum of any rectangle in O(1)\n    vector<vector<long long>> p;\n    explicit Prefix2D(const vector<vector<int>>& g) : p(g.size() + 1, vector<long long>(g[0].size() + 1, 0)) {\n        for (size_t i = 0; i < g.size(); i++)\n            for (size_t j = 0; j < g[0].size(); j++)\n                p[i + 1][j + 1] = g[i][j] + p[i][j + 1] + p[i + 1][j] - p[i][j];\n    }\n    long long sum(int r1, int c1, int r2, int c2) const {   // corners included\n        return p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1];\n    }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(subarraySum({1, 1, 1}, 2) == 2 && subarraySum({1, 2, 3}, 3) == 2);\n    Prefix2D p({{1, 2}, {3, 4}});\n    assert(p.sum(0, 0, 1, 1) == 10 && p.sum(1, 0, 1, 1) == 7);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array"
    ]
  },
  {
    "id": "mono-stack",
    "title": "Monotonic stack",
    "when": "Next greater or smaller element, histogram areas, stock spans",
    "cost": "O(n)",
    "code": "#include <stack>\n#include <vector>\nusing namespace std;\n\nvector<int> nextGreater(const vector<int>& a) {  // -1 when there is none\n    vector<int> res(a.size(), -1);\n    stack<int> st;                                 // indexes still waiting for a bigger value\n    for (int i = 0; i < (int)a.size(); i++) {\n        while (!st.empty() && a[st.top()] < a[i]) { res[st.top()] = a[i]; st.pop(); }\n        st.push(i);                                // each index is pushed and popped once\n    }\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(nextGreater({2, 1, 2, 4, 3}) == vector<int>({4, 2, 4, -1, -1}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "stack"
    ]
  },
  {
    "id": "mono-deque",
    "title": "Sliding window maximum (monotonic deque)",
    "when": "Max or min of every window of size k",
    "cost": "O(n)",
    "code": "#include <deque>\n#include <vector>\nusing namespace std;\n\nvector<int> windowMax(const vector<int>& a, int k) {\n    deque<int> dq;                                 // indexes, values decreasing front to back\n    vector<int> res;\n    for (int i = 0; i < (int)a.size(); i++) {\n        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();       // fell out of the window\n        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();   // can never be the max again\n        dq.push_back(i);\n        if (i >= k - 1) res.push_back(a[dq.front()]);\n    }\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(windowMax({1, 3, -1, -3, 5, 3, 6, 7}, 3) == vector<int>({3, 3, 5, 5, 6, 7}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "stack"
    ]
  },
  {
    "id": "linked-list",
    "title": "Linked list: reverse, middle, cycle",
    "when": "Reverse a list or part of it, find the middle, detect a cycle",
    "cost": "O(n), O(1) space",
    "code": "struct ListNode {\n    int val;\n    ListNode* next;\n    explicit ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}\n};\n\nListNode* reverseList(ListNode* head) {\n    ListNode* prev = nullptr;\n    while (head) {\n        ListNode* next = head->next;               // save, point back, move on\n        head->next = prev;\n        prev = head;\n        head = next;\n    }\n    return prev;\n}\n\nListNode* middle(ListNode* head) {               // slow moves 1, fast moves 2\n    ListNode *slow = head, *fast = head;\n    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }\n    return slow;                                   // second middle for even lengths\n}\n\nbool hasCycle(ListNode* head) {                  // Floyd: fast catches slow inside a cycle\n    ListNode *slow = head, *fast = head;\n    while (fast && fast->next) {\n        slow = slow->next; fast = fast->next->next;\n        if (slow == fast) return true;\n    }\n    return false;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    ListNode e(5), d(4, &e), c(3, &d), b(2, &c), a(1, &b);\n    assert(middle(&a)->val == 3 && !hasCycle(&a));\n    ListNode* r = reverseList(&a);\n    assert(r->val == 5 && r->next->val == 4 && a.next == nullptr);\n    reverseList(r);\n    e.next = &c;\n    assert(hasCycle(&a));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "linkedlist"
    ]
  },
  {
    "id": "grid-bfs",
    "title": "BFS on a grid",
    "when": "Fewest steps in a maze or grid, multi-source spreading (rotting oranges)",
    "cost": "O(rows x cols)",
    "code": "#include <queue>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint shortestPath(const vector<string>& g) {      // steps from top-left to bottom-right through '.', or -1\n    int R = g.size(), C = g[0].size();\n    if (g[0][0] == '#') return -1;\n    vector<vector<int>> dist(R, vector<int>(C, -1));\n    queue<pair<int, int>> q;\n    q.push({0, 0});\n    dist[0][0] = 0;\n    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};\n    while (!q.empty()) {\n        auto [r, c] = q.front(); q.pop();\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dr[k], nc = c + dc[k];\n            if (nr < 0 || nr >= R || nc < 0 || nc >= C || g[nr][nc] == '#' || dist[nr][nc] != -1) continue;\n            dist[nr][nc] = dist[r][c] + 1;           // mark when pushed, not when popped\n            q.push({nr, nc});\n        }\n    }\n    return dist[R - 1][C - 1];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(shortestPath({\"..#\", \"#..\", \"...\"}) == 4);\n    assert(shortestPath({\".#\", \"#.\"}) == -1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "components",
    "title": "DFS without recursion: connected components",
    "when": "Islands, provinces, groups; large inputs where recursion could overflow the stack",
    "cost": "O(V + E)",
    "code": "#include <vector>\nusing namespace std;\n\nint countComponents(int n, const vector<pair<int, int>>& edges) {\n    vector<vector<int>> adj(n);\n    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }\n    vector<bool> seen(n);\n    int comps = 0;\n    for (int s = 0; s < n; s++) {\n        if (seen[s]) continue;\n        comps++;\n        vector<int> st = {s};                        // an explicit stack instead of recursion\n        seen[s] = true;\n        while (!st.empty()) {\n            int u = st.back(); st.pop_back();\n            for (int v : adj[u]) if (!seen[v]) { seen[v] = true; st.push_back(v); }\n        }\n    }\n    return comps;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(countComponents(5, {{0, 1}, {1, 2}, {3, 4}}) == 2 && countComponents(3, {}) == 3);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "tree",
    "title": "Binary tree: traversals, depth, LCA",
    "when": "Any tree question: inorder without recursion, level order, height, lowest common ancestor",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <queue>\n#include <stack>\n#include <vector>\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode *left = nullptr, *right = nullptr;\n    explicit TreeNode(int v) : val(v) {}\n};\n\nvector<int> inorder(TreeNode* root) {           // iterative: no recursion depth limit\n    vector<int> out;\n    stack<TreeNode*> st;\n    for (TreeNode* t = root; t || !st.empty(); t = t->right) {\n        while (t) { st.push(t); t = t->left; }     // go as far left as possible\n        t = st.top(); st.pop();\n        out.push_back(t->val);\n    }\n    return out;\n}\n\nvector<vector<int>> levelOrder(TreeNode* root) {\n    vector<vector<int>> out;\n    queue<TreeNode*> q;\n    if (root) q.push(root);\n    while (!q.empty()) {\n        out.emplace_back();\n        for (size_t k = q.size(); k > 0; k--) {    // exactly one level per pass\n            TreeNode* t = q.front(); q.pop();\n            out.back().push_back(t->val);\n            if (t->left) q.push(t->left);\n            if (t->right) q.push(t->right);\n        }\n    }\n    return out;\n}\n\nint depth(TreeNode* t) { return t ? 1 + max(depth(t->left), depth(t->right)) : 0; }\n\nTreeNode* lca(TreeNode* t, TreeNode* p, TreeNode* q) {   // any binary tree\n    if (!t || t == p || t == q) return t;\n    TreeNode* l = lca(t->left, p, q);\n    TreeNode* r = lca(t->right, p, q);\n    return l && r ? t : (l ? l : r);               // found on both sides: t is the answer\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    TreeNode n4(4), n5(5), n2(2), n3(3), n1(1);\n    n1.left = &n2; n1.right = &n3; n2.left = &n4; n2.right = &n5;\n    assert(inorder(&n1) == vector<int>({4, 2, 5, 1, 3}));\n    assert(levelOrder(&n1) == (vector<vector<int>>{{1}, {2, 3}, {4, 5}}));\n    assert(depth(&n1) == 3 && lca(&n1, &n4, &n5) == &n2 && lca(&n1, &n4, &n3) == &n1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "binary-tree"
    ]
  },
  {
    "id": "dijkstra",
    "title": "Dijkstra",
    "when": "Shortest paths with non-negative weights (network delay, cheapest route)",
    "cost": "O((V + E) log V)",
    "code": "#include <climits>\n#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<long long> dijkstra(int n, const vector<vector<pair<int, int>>>& adj, int src) {   // adj[u] = {(v, w)}\n    vector<long long> dist(n, LLONG_MAX);\n    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;   // min-heap\n    dist[src] = 0;\n    pq.push({0, src});\n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        if (d > dist[u]) continue;                   // stale entry: a shorter one was already used\n        for (auto [v, w] : adj[u])\n            if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }\n    }\n    return dist;                                     // LLONG_MAX: unreachable\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<vector<pair<int, int>>> adj(5);\n    adj[0] = {{1, 4}, {2, 1}}; adj[2] = {{1, 2}, {3, 5}}; adj[1] = {{3, 1}}; adj[3] = {{4, 3}};\n    assert(dijkstra(5, adj, 0) == vector<long long>({0, 3, 1, 4, 7}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph",
      "heap"
    ]
  },
  {
    "id": "topo",
    "title": "Topological sort (Kahn) and cycle check",
    "when": "Course schedule, build order, any \"A before B\" constraints",
    "cost": "O(V + E)",
    "code": "#include <queue>\n#include <vector>\nusing namespace std;\n\nvector<int> topoSort(int n, const vector<pair<int, int>>& edges) {   // empty result means a cycle\n    vector<vector<int>> adj(n);\n    vector<int> indeg(n, 0);\n    for (auto [u, v] : edges) { adj[u].push_back(v); indeg[v]++; }\n    queue<int> q;\n    for (int u = 0; u < n; u++) if (indeg[u] == 0) q.push(u);\n    vector<int> order;\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        order.push_back(u);\n        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);\n    }\n    if ((int)order.size() < n) order.clear();\n    return order;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<pair<int, int>> e = {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}};\n    assert(topoSort(6, e) == vector<int>({4, 5, 2, 0, 3, 1}));\n    e.push_back({1, 5});\n    assert(topoSort(6, e).empty());\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "dsu",
    "title": "Union-find and Kruskal's MST",
    "when": "Dynamic connectivity, redundant edge, minimum spanning tree",
    "cost": "Almost O(1) per operation; Kruskal O(E log E)",
    "code": "#include <algorithm>\n#include <array>\n#include <numeric>\n#include <vector>\nusing namespace std;\n\nstruct DSU {\n    vector<int> parent, size;\n    explicit DSU(int n) : parent(n), size(n, 1) { iota(parent.begin(), parent.end(), 0); }\n    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }   // path compression\n    bool unite(int a, int b) {\n        a = find(a); b = find(b);\n        if (a == b) return false;                  // already connected: this edge makes a cycle\n        if (size[a] < size[b]) swap(a, b);         // union by size\n        parent[b] = a;\n        size[a] += size[b];\n        return true;\n    }\n};\n\nlong long kruskal(int n, vector<array<int, 3>> edges) {   // edges as {w, u, v}; -1 if not connected\n    sort(edges.begin(), edges.end());\n    DSU d(n);\n    long long total = 0;\n    int used = 0;\n    for (auto [w, u, v] : edges) if (d.unite(u, v)) { total += w; used++; }\n    return used == n - 1 ? total : -1;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    DSU d(6);\n    d.unite(0, 1); d.unite(1, 2); d.unite(3, 4);\n    assert(d.find(0) == d.find(2) && d.find(0) != d.find(3) && !d.unite(2, 0));\n    assert(kruskal(4, {{1, 0, 1}, {4, 1, 2}, {3, 0, 2}, {2, 2, 3}, {5, 1, 3}}) == 6);\n    assert(kruskal(3, {{1, 0, 1}}) == -1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "floyd",
    "title": "Floyd-Warshall",
    "when": "All-pairs shortest paths for small n (up to about 400)",
    "cost": "O(n^3)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nconst long long INF = 1e18;\n\nvoid floyd(vector<vector<long long>>& d) {        // d[i][j]: edge weight or INF, 0 on the diagonal\n    int n = d.size();\n    for (int k = 0; k < n; k++)                     // k must be the outermost loop\n        for (int i = 0; i < n; i++)\n            for (int j = 0; j < n; j++)\n                if (d[i][k] < INF && d[k][j] < INF) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<vector<long long>> d = {{0, 3, INF}, {INF, 0, 1}, {2, INF, 0}};\n    floyd(d);\n    assert(d[0][2] == 4 && d[2][1] == 5 && d[1][0] == 3);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "segtree",
    "title": "Segment tree (point update, range sum)",
    "when": "Range queries mixed with updates; swap + for min, max or gcd",
    "cost": "O(log n) per operation",
    "code": "#include <vector>\nusing namespace std;\n\nstruct SegTree {                                   // iterative, 0-based, 2n memory\n    int n;\n    vector<long long> t;\n    explicit SegTree(const vector<int>& a) : n(a.size()), t(2 * a.size()) {\n        for (int i = 0; i < n; i++) t[n + i] = a[i];\n        for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];\n    }\n    void update(int i, long long v) {              // a[i] = v\n        for (t[i += n] = v; i > 1; i /= 2) t[i / 2] = t[i] + t[i ^ 1];\n    }\n    long long query(int l, int r) const {          // sum of a[l..r), r excluded\n        long long s = 0;\n        for (l += n, r += n; l < r; l /= 2, r /= 2) {\n            if (l & 1) s += t[l++];\n            if (r & 1) s += t[--r];\n        }\n        return s;\n    }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    SegTree st({1, 3, 5, 7, 9, 11});\n    assert(st.query(1, 4) == 15);\n    st.update(2, 10);\n    assert(st.query(1, 4) == 20 && st.query(0, 6) == 41);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "binary-tree"
    ]
  },
  {
    "id": "merge-sort",
    "title": "Merge sort and counting inversions",
    "when": "Stable O(n log n) sort; count pairs i < j with a[i] > a[j]",
    "cost": "O(n log n)",
    "code": "#include <vector>\nusing namespace std;\n\nlong long sortCount(vector<int>& a, int lo, int hi, vector<int>& tmp) {   // sorts a[lo, hi), returns inversions\n    if (hi - lo < 2) return 0;\n    int mid = (lo + hi) / 2;\n    long long inv = sortCount(a, lo, mid, tmp) + sortCount(a, mid, hi, tmp);\n    int i = lo, j = mid, k = lo;\n    while (i < mid || j < hi) {\n        if (j == hi || (i < mid && a[i] <= a[j])) tmp[k++] = a[i++];   // <= keeps it stable\n        else { inv += mid - i; tmp[k++] = a[j++]; }                     // every remaining left value is bigger\n    }\n    for (k = lo; k < hi; k++) a[k] = tmp[k];\n    return inv;\n}\n\nlong long countInversions(vector<int> a) {\n    vector<int> tmp(a.size());\n    return sortCount(a, 0, a.size(), tmp);\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(countInversions({2, 4, 1, 3, 5}) == 3 && countInversions({5, 4, 3, 2, 1}) == 10 && countInversions({1, 2}) == 0);\n    vector<int> v = {5, 1, 4, 2}, tmp(4);\n    sortCount(v, 0, 4, tmp);\n    assert(v == vector<int>({1, 2, 4, 5}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "recursion-backtracking"
    ]
  },
  {
    "id": "fenwick",
    "title": "Fenwick tree (binary indexed tree)",
    "when": "Prefix sums with updates, counting inversions; less code than a segment tree",
    "cost": "O(log n) per operation",
    "code": "#include <vector>\nusing namespace std;\n\nstruct Fenwick {\n    int n;\n    vector<long long> f;\n    explicit Fenwick(int n) : n(n), f(n + 1, 0) {}\n    void add(int i, long long v) { for (i++; i <= n; i += i & -i) f[i] += v; }   // 0-based i\n    long long prefix(int i) const {                // sum of a[0..i]\n        long long s = 0;\n        for (i++; i > 0; i -= i & -i) s += f[i];\n        return s;\n    }\n    long long range(int l, int r) const { return prefix(r) - (l ? prefix(l - 1) : 0); }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    Fenwick fw(6);\n    int a[] = {1, 3, 5, 7, 9, 11};\n    for (int i = 0; i < 6; i++) fw.add(i, a[i]);\n    assert(fw.range(1, 3) == 15 && fw.prefix(5) == 36);\n    fw.add(2, 5);\n    assert(fw.range(1, 3) == 20);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "binary-tree"
    ]
  },
  {
    "id": "trie",
    "title": "Trie with a node pool",
    "when": "Prefix search, word dictionaries, autocomplete, XOR tricks on bits",
    "cost": "O(word length)",
    "code": "#include <array>\n#include <string>\n#include <vector>\nusing namespace std;\n\nstruct Trie {                                      // nodes live in vectors: fast and nothing to free\n    vector<array<int, 26>> next{array<int, 26>{}};   // 0 means no child; node 0 is the root\n    vector<bool> word{false};\n    void insert(const string& s) {\n        int u = 0;\n        for (char ch : s) {\n            int c = ch - 'a';\n            if (!next[u][c]) { next[u][c] = next.size(); next.push_back({}); word.push_back(false); }\n            u = next[u][c];\n        }\n        word[u] = true;\n    }\n    int walk(const string& s) const {              // node reached by this prefix, or -1\n        int u = 0;\n        for (char ch : s) { u = next[u][ch - 'a']; if (!u) return -1; }\n        return u;\n    }\n    bool search(const string& s) const { int u = walk(s); return u != -1 && word[u]; }\n    bool startsWith(const string& p) const { return walk(p) != -1; }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    Trie t;\n    for (string w : {\"apple\", \"app\", \"apt\", \"bat\"}) t.insert(w);\n    assert(t.search(\"app\") && !t.search(\"appl\") && t.startsWith(\"ap\") && !t.startsWith(\"c\"));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "trie"
    ]
  },
  {
    "id": "knapsack",
    "title": "Knapsack and coin change",
    "when": "Pick items under a capacity; fewest coins; count ways",
    "cost": "O(n x capacity)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint knapsack(const vector<int>& wt, const vector<int>& val, int cap) {   // each item at most once\n    vector<int> dp(cap + 1, 0);                      // dp[c] = best value within capacity c\n    for (size_t i = 0; i < wt.size(); i++)\n        for (int c = cap; c >= wt[i]; c--)           // backwards, so an item is never reused\n            dp[c] = max(dp[c], dp[c - wt[i]] + val[i]);\n    return dp[cap];\n}\n\nint coinChange(const vector<int>& coins, int amount) {   // unlimited coins: loop forwards\n    const int INF = 1e9;\n    vector<int> dp(amount + 1, INF);\n    dp[0] = 0;\n    for (int a = 1; a <= amount; a++)\n        for (int c : coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n    return dp[amount] >= INF ? -1 : dp[amount];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(knapsack({1, 3, 4, 5}, {1, 4, 5, 7}, 7) == 9);\n    assert(coinChange({1, 2, 5}, 11) == 3 && coinChange({2}, 3) == -1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp"
    ]
  },
  {
    "id": "lis",
    "title": "Longest increasing subsequence",
    "when": "LIS, envelopes, stacking boxes",
    "cost": "O(n log n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint lis(const vector<int>& a) {                    // strictly increasing\n    vector<int> tails;                               // tails[k]: smallest end of an increasing run of length k + 1\n    for (int x : a) {\n        auto it = lower_bound(tails.begin(), tails.end(), x);   // upper_bound for non-decreasing\n        if (it == tails.end()) tails.push_back(x); else *it = x;\n    }\n    return tails.size();\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(lis({10, 9, 2, 5, 3, 7, 101, 18}) == 4 && lis({7, 7, 7}) == 1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp"
    ]
  },
  {
    "id": "quickselect",
    "title": "Quickselect and top k",
    "when": "K-th largest or smallest; top k frequent",
    "cost": "O(n) average with quickselect, O(n log k) with a heap",
    "code": "#include <algorithm>\n#include <functional>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nint kthLargest(vector<int> a, int k) {             // nth_element is the library quickselect\n    nth_element(a.begin(), a.begin() + (k - 1), a.end(), greater<int>());\n    return a[k - 1];\n}\n\nint kthLargestHeap(const vector<int>& a, int k) {  // keep the k largest in a min-heap\n    priority_queue<int, vector<int>, greater<int>> pq;\n    for (int x : a) {\n        pq.push(x);\n        if ((int)pq.size() > k) pq.pop();           // drop the smallest of the k + 1\n    }\n    return pq.top();\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(kthLargest({3, 2, 1, 5, 6, 4}, 2) == 5 && kthLargestHeap({3, 2, 3, 1, 2, 4, 5, 5, 6}, 4) == 4);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "heap",
      "array"
    ]
  },
  {
    "id": "string-dp",
    "title": "LCS and edit distance",
    "when": "Comparing two strings: common subsequence, minimum edits",
    "cost": "O(n x m)",
    "code": "#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint lcs(const string& a, const string& b) {\n    vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1, 0));\n    for (size_t i = 1; i <= a.size(); i++)\n        for (size_t j = 1; j <= b.size(); j++)\n            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);\n    return dp[a.size()][b.size()];\n}\n\nint editDistance(const string& a, const string& b) {   // insert, delete or replace one character\n    vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1));\n    for (size_t i = 0; i <= a.size(); i++) dp[i][0] = i;\n    for (size_t j = 0; j <= b.size(); j++) dp[0][j] = j;\n    for (size_t i = 1; i <= a.size(); i++)\n        for (size_t j = 1; j <= b.size(); j++)\n            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] : 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});\n    return dp[a.size()][b.size()];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(lcs(\"abcde\", \"ace\") == 3 && editDistance(\"horse\", \"ros\") == 3 && editDistance(\"\", \"abc\") == 3);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp",
      "string"
    ]
  },
  {
    "id": "backtrack",
    "title": "Backtracking: subsets and permutations",
    "when": "Generate all subsets, permutations, combinations; n up to about 10 to 20",
    "cost": "O(2^n) or O(n!)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvoid subsets(const vector<int>& a, size_t i, vector<int>& cur, vector<vector<int>>& out) {\n    if (i == a.size()) { out.push_back(cur); return; }\n    subsets(a, i + 1, cur, out);                     // skip a[i]\n    cur.push_back(a[i]);\n    subsets(a, i + 1, cur, out);                     // take a[i]\n    cur.pop_back();                                  // undo before returning\n}\n\nvector<vector<int>> permutations(vector<int> a) {\n    sort(a.begin(), a.end());                        // next_permutation starts from the smallest order\n    vector<vector<int>> out;\n    do out.push_back(a); while (next_permutation(a.begin(), a.end()));\n    return out;                                      // repeated values give no repeated permutations\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<int> cur;\n    vector<vector<int>> out;\n    subsets({1, 2, 3}, 0, cur, out);\n    assert(out.size() == 8);\n    assert(permutations({1, 1, 2}).size() == 3 && permutations({3, 2, 1}).size() == 6);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "recursion-backtracking"
    ]
  },
  {
    "id": "number-theory",
    "title": "Modular power, inverse and nCr",
    "when": "Answers modulo 1e9+7, combinatorics, probabilities as fractions",
    "cost": "O(log e) power; O(n) setup then O(1) nCr",
    "code": "#include <vector>\nusing namespace std;\n\nconst long long MOD = 1'000'000'007;\n\nlong long power(long long b, long long e, long long m = MOD) {\n    long long r = 1;\n    b %= m;\n    for (; e > 0; e >>= 1, b = b * b % m) if (e & 1) r = r * b % m;\n    return r;\n}\n\nlong long inverse(long long a) { return power(a, MOD - 2); }   // Fermat's little theorem: MOD is prime\n\nstruct Binomial {\n    vector<long long> f, inv;\n    explicit Binomial(int n) : f(n + 1), inv(n + 1) {\n        f[0] = 1;\n        for (int i = 1; i <= n; i++) f[i] = f[i - 1] * i % MOD;\n        inv[n] = inverse(f[n]);\n        for (int i = n; i > 0; i--) inv[i - 1] = inv[i] * i % MOD;\n    }\n    long long C(int n, int r) const { return r < 0 || r > n ? 0 : f[n] * inv[r] % MOD * inv[n - r] % MOD; }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(power(2, 10) == 1024 && power(2, 100) == 976371285);\n    assert(inverse(2) * 2 % MOD == 1);\n    Binomial b(1000);\n    assert(b.C(5, 2) == 10 && b.C(10, 0) == 1 && b.C(3, 5) == 0);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "bit-and-math"
    ]
  },
  {
    "id": "sieve",
    "title": "Sieve of Eratosthenes and gcd",
    "when": "Many primality checks, counting primes, factorising many numbers",
    "cost": "O(n log log n)",
    "code": "#include <numeric>\n#include <vector>\nusing namespace std;\n\nvector<int> primesUpTo(int n) {\n    vector<bool> composite(n + 1, false);\n    vector<int> primes;\n    for (int i = 2; i <= n; i++) {\n        if (composite[i]) continue;\n        primes.push_back(i);\n        for (long long j = (long long)i * i; j <= n; j += i) composite[j] = true;   // start at i * i\n    }\n    return primes;\n}\n\nlong long lcmOf(long long a, long long b) { return a / gcd(a, b) * b; }   // divide first to avoid overflow",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    auto p = primesUpTo(30);\n    assert(p.size() == 10 && p.back() == 29);\n    assert(gcd(12, 18) == 6 && lcmOf(12, 18) == 36);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "bit-and-math"
    ]
  },
  {
    "id": "kmp",
    "title": "KMP string matching",
    "when": "Find a pattern in a text in linear time; repeated substrings; shortest palindrome",
    "cost": "O(n + m)",
    "code": "#include <string>\n#include <vector>\nusing namespace std;\n\nvector<int> prefixFunction(const string& s) {      // pi[i]: longest proper prefix of s[0..i] that is also a suffix\n    vector<int> pi(s.size(), 0);\n    for (size_t i = 1; i < s.size(); i++) {\n        int k = pi[i - 1];\n        while (k > 0 && s[i] != s[k]) k = pi[k - 1];\n        if (s[i] == s[k]) k++;\n        pi[i] = k;\n    }\n    return pi;\n}\n\nvector<int> findAll(const string& text, const string& pat) {   // every start index\n    string s = pat + '#' + text;                       // '#' must not occur in either string\n    vector<int> pi = prefixFunction(s), res;\n    for (size_t i = pat.size() + 1; i < s.size(); i++)\n        if (pi[i] == (int)pat.size()) res.push_back(i - 2 * pat.size());\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(findAll(\"abababa\", \"aba\") == vector<int>({0, 2, 4}));\n    assert(findAll(\"aaaa\", \"b\").empty());\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "string"
    ]
  },
  {
    "id": "bits",
    "title": "Bit tricks and submask loops",
    "when": "Bitmask DP, single number (XOR), counting set bits, subsets of a mask",
    "cost": "O(1) per trick; O(3^n) over all submasks",
    "code": "#include <bit>\n#include <vector>\nusing namespace std;\n\nbool isPow2(unsigned x) { return x && !(x & (x - 1)); }     // exactly one bit set\nint lowBit(int x) { return x & -x; }                          // value of the lowest set bit\nint singleNumber(const vector<int>& a) {                      // pairs cancel under XOR\n    int x = 0;\n    for (int v : a) x ^= v;\n    return x;\n}\nvector<int> submasks(int mask) {                              // every subset of mask's bits, largest first\n    vector<int> out;\n    for (int s = mask; s > 0; s = (s - 1) & mask) out.push_back(s);\n    out.push_back(0);\n    return out;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(isPow2(16) && !isPow2(12) && lowBit(12) == 4 && popcount(13u) == 3);\n    assert(singleNumber({4, 1, 2, 1, 2}) == 4);\n    assert(submasks(0b101) == vector<int>({5, 4, 1, 0}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "bit-and-math"
    ]
  },
  {
    "id": "palindromes",
    "title": "Palindromes and anagram windows",
    "when": "Longest palindromic substring; find every anagram of a pattern in a text",
    "cost": "O(n^2) and O(n)",
    "code": "#include <array>\n#include <string>\n#include <vector>\nusing namespace std;\n\nstring longestPalindrome(const string& s) {        // expand around each of the 2n - 1 centres\n    int best = 0, start = 0;\n    for (int c = 0; c < 2 * (int)s.size() - 1; c++) {\n        int l = c / 2, r = l + c % 2;               // odd centre on a letter, even centre between two\n        while (l >= 0 && r < (int)s.size() && s[l] == s[r]) { l--; r++; }\n        if (r - l - 1 > best) { best = r - l - 1; start = l + 1; }\n    }\n    return s.substr(start, best);\n}\n\nvector<int> findAnagrams(const string& s, const string& p) {   // fixed-size window of p.size()\n    vector<int> res;\n    if (p.size() > s.size()) return res;\n    array<int, 26> need{}, have{};\n    for (char c : p) need[c - 'a']++;\n    for (size_t i = 0; i < s.size(); i++) {\n        have[s[i] - 'a']++;\n        if (i >= p.size()) have[s[i - p.size()] - 'a']--;   // the letter leaving the window\n        if (have == need) res.push_back(i + 1 - p.size());\n    }\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(longestPalindrome(\"babad\") == \"bab\" && longestPalindrome(\"cbbd\") == \"bb\" && longestPalindrome(\"a\") == \"a\");\n    assert(findAnagrams(\"cbaebabacd\", \"abc\") == vector<int>({0, 6}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "string"
    ]
  },
  {
    "id": "stack-basics",
    "title": "Stack: valid brackets and min stack",
    "when": "Matching brackets, undo, evaluating expressions, a stack that also reports its minimum",
    "cost": "O(n), O(1) per operation",
    "code": "#include <stack>\n#include <string>\nusing namespace std;\n\nbool validBrackets(const string& s) {\n    stack<char> st;\n    for (char c : s) {\n        if (c == '(' || c == '[' || c == '{') st.push(c);\n        else {\n            if (st.empty()) return false;              // a closer with nothing open\n            char o = st.top(); st.pop();\n            if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;\n        }\n    }\n    return st.empty();                                 // anything left open is invalid\n}\n\nstruct MinStack {                                      // each entry remembers the minimum below it\n    stack<pair<int, int>> st;                          // {value, minimum so far}\n    void push(int x) { st.push({x, st.empty() ? x : min(x, st.top().second)}); }\n    void pop() { st.pop(); }\n    int top() const { return st.top().first; }\n    int getMin() const { return st.top().second; }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(validBrackets(\"([]{})\") && !validBrackets(\"(]\") && !validBrackets(\"((\") && validBrackets(\"\"));\n    MinStack m;\n    m.push(5); m.push(2); m.push(7);\n    assert(m.getMin() == 2 && m.top() == 7);\n    m.pop(); m.pop();\n    assert(m.getMin() == 5);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "stack"
    ]
  },
  {
    "id": "heaps",
    "title": "Heaps: running median and merging k sorted lists",
    "when": "Median of a stream, merge k sorted arrays or lists, k closest points",
    "cost": "O(log n) per number; O(N log k) to merge",
    "code": "#include <functional>\n#include <queue>\n#include <tuple>\n#include <vector>\nusing namespace std;\n\nstruct MedianFinder {                                  // low holds the smaller half (max-heap), high the larger (min-heap)\n    priority_queue<int> low;\n    priority_queue<int, vector<int>, greater<int>> high;\n    void add(int x) {\n        low.push(x);\n        high.push(low.top()); low.pop();               // the largest of the small half moves up\n        if (high.size() > low.size()) { low.push(high.top()); high.pop(); }   // keep low the same size or one bigger\n    }\n    double median() const { return low.size() > high.size() ? low.top() : (low.top() + high.top()) / 2.0; }\n};\n\nvector<int> mergeK(const vector<vector<int>>& lists) {\n    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> pq;   // {value, list, index}\n    for (int i = 0; i < (int)lists.size(); i++) if (!lists[i].empty()) pq.push({lists[i][0], i, 0});\n    vector<int> out;\n    while (!pq.empty()) {\n        auto [v, i, j] = pq.top(); pq.pop();\n        out.push_back(v);\n        if (j + 1 < (int)lists[i].size()) pq.push({lists[i][j + 1], i, j + 1});\n    }\n    return out;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    MedianFinder m;\n    m.add(5); assert(m.median() == 5);\n    m.add(2); assert(m.median() == 3.5);\n    m.add(9); assert(m.median() == 5);\n    assert(mergeK({{1, 4, 5}, {1, 3, 4}, {2, 6}}) == vector<int>({1, 1, 2, 3, 4, 4, 5, 6}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "heap"
    ]
  },
  {
    "id": "meeting-rooms",
    "title": "Meeting rooms and interval sweeps",
    "when": "Minimum rooms or platforms, maximum overlap, can one person attend everything",
    "cost": "O(n log n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint minRooms(const vector<pair<int, int>>& meetings) {   // [start, end); a meeting may start when another ends\n    vector<int> starts, ends;\n    for (auto [s, e] : meetings) { starts.push_back(s); ends.push_back(e); }\n    sort(starts.begin(), starts.end());\n    sort(ends.begin(), ends.end());\n    int rooms = 0, best = 0;\n    for (size_t i = 0, j = 0; i < starts.size(); i++) {\n        while (j < ends.size() && ends[j] <= starts[i]) { j++; rooms--; }   // free rooms that ended in time\n        best = max(best, ++rooms);\n    }\n    return best;\n}\n\nbool canAttendAll(vector<pair<int, int>> v) {\n    sort(v.begin(), v.end());\n    for (size_t i = 1; i < v.size(); i++) if (v[i].first < v[i - 1].second) return false;\n    return true;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(minRooms({{0, 30}, {5, 10}, {15, 20}}) == 2 && minRooms({{1, 5}, {5, 10}}) == 1);\n    assert(!canAttendAll({{0, 30}, {5, 10}}) && canAttendAll({{7, 10}, {2, 4}}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "intervals"
    ]
  },
  {
    "id": "greedy",
    "title": "Greedy: jump game and activity selection",
    "when": "Can you reach the end, fewest jumps, most non-overlapping intervals",
    "cost": "O(n) and O(n log n)",
    "code": "#include <algorithm>\n#include <climits>\n#include <vector>\nusing namespace std;\n\nbool canJump(const vector<int>& a) {                  // farthest index reachable so far\n    int far = 0;\n    for (int i = 0; i < (int)a.size(); i++) {\n        if (i > far) return false;                     // stuck before reaching i\n        far = max(far, i + a[i]);\n    }\n    return true;\n}\n\nint minJumps(const vector<int>& a) {                  // BFS by levels: each level is one jump\n    int jumps = 0, end = 0, far = 0;\n    for (int i = 0; i + 1 < (int)a.size(); i++) {\n        far = max(far, i + a[i]);\n        if (i == end) { jumps++; end = far; }\n    }\n    return jumps;\n}\n\nint maxNonOverlapping(vector<pair<int, int>> v) {     // keep the interval that ends first\n    sort(v.begin(), v.end(), [](auto& x, auto& y) { return x.second < y.second; });\n    int count = 0, lastEnd = INT_MIN;\n    for (auto [s, e] : v) if (s >= lastEnd) { count++; lastEnd = e; }\n    return count;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(canJump({2, 3, 1, 1, 4}) && !canJump({3, 2, 1, 0, 4}));\n    assert(minJumps({2, 3, 1, 1, 4}) == 2 && minJumps({0}) == 0);\n    assert(maxNonOverlapping({{1, 2}, {2, 3}, {3, 4}, {1, 3}}) == 3);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "greedy",
      "intervals"
    ]
  },
  {
    "id": "n-queens",
    "title": "N-Queens",
    "when": "Place pieces under constraints; the classic pruned backtracking",
    "cost": "O(n!) with pruning",
    "code": "#include <vector>\nusing namespace std;\n\nint nQueens(int n) {                                   // count placements; one queen per row\n    vector<bool> col(n), diag(2 * n), anti(2 * n);     // columns and both diagonals in use\n    int count = 0;\n    auto place = [&](auto&& self, int r) -> void {\n        if (r == n) { count++; return; }\n        for (int c = 0; c < n; c++) {\n            if (col[c] || diag[r + c] || anti[r - c + n]) continue;   // prune attacked squares\n            col[c] = diag[r + c] = anti[r - c + n] = true;\n            self(self, r + 1);\n            col[c] = diag[r + c] = anti[r - c + n] = false;           // undo\n        }\n    };\n    place(place, 0);\n    return count;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(nQueens(4) == 2 && nQueens(8) == 92 && nQueens(1) == 1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "recursion-backtracking"
    ]
  },
  {
    "id": "bst",
    "title": "Binary search tree: insert, search, validate",
    "when": "BST insert and lookup, check a tree is a valid BST, k-th smallest",
    "cost": "O(height)",
    "code": "#include <climits>\n#include <vector>\nusing namespace std;\n\nstruct Node {\n    int val;\n    Node *left = nullptr, *right = nullptr;\n    explicit Node(int v) : val(v) {}\n};\n\nNode* insert(Node* t, int v) {\n    if (!t) return new Node(v);\n    if (v < t->val) t->left = insert(t->left, v);\n    else t->right = insert(t->right, v);\n    return t;\n}\n\nbool contains(Node* t, int v) {\n    while (t && t->val != v) t = v < t->val ? t->left : t->right;\n    return t != nullptr;\n}\n\nbool isBST(Node* t, long long lo = LLONG_MIN, long long hi = LLONG_MAX) {   // pass the allowed range down\n    if (!t) return true;\n    if (t->val <= lo || t->val >= hi) return false;        // checking only the children is not enough\n    return isBST(t->left, lo, t->val) && isBST(t->right, t->val, hi);\n}\n\nvoid kthSmallest(Node* t, int& k, int& out) {          // inorder visits values in sorted order\n    if (!t || k == 0) return;\n    kthSmallest(t->left, k, out);\n    if (k > 0 && --k == 0) out = t->val;\n    kthSmallest(t->right, k, out);\n}\n\nvoid destroy(Node* t) { if (t) { destroy(t->left); destroy(t->right); delete t; } }",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    Node* root = nullptr;\n    for (int v : {5, 3, 8, 1, 4, 9}) root = insert(root, v);\n    assert(contains(root, 4) && !contains(root, 7) && isBST(root));\n    int k = 3, out = -1;\n    kthSmallest(root, k, out);\n    assert(out == 4);\n    root->left->right->val = 6;                         // 6 sits in 5's left subtree: invalid\n    assert(!isBST(root));\n    destroy(root);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "binary-tree"
    ]
  },
  {
    "id": "dutch-majority",
    "title": "Sort colors and majority element",
    "when": "Three-way partition in one pass; the value that appears more than n/2 times",
    "cost": "O(n), O(1) space",
    "code": "#include <utility>\n#include <vector>\nusing namespace std;\n\nvoid sortColors(vector<int>& a) {                  // Dutch national flag: 0s, then 1s, then 2s\n    int lo = 0, mid = 0, hi = (int)a.size() - 1;\n    while (mid <= hi) {\n        if (a[mid] == 0) swap(a[lo++], a[mid++]);\n        else if (a[mid] == 1) mid++;\n        else swap(a[mid], a[hi--]);                // do not advance mid: the swapped-in value is unchecked\n    }\n}\n\nint majority(const vector<int>& a) {              // Boyer-Moore vote; assumes a majority exists\n    int cand = 0, count = 0;\n    for (int x : a) {\n        if (count == 0) cand = x;\n        count += x == cand ? 1 : -1;\n    }\n    return cand;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<int> a = {2, 0, 2, 1, 1, 0};\n    sortColors(a);\n    assert(a == vector<int>({0, 0, 1, 1, 2, 2}));\n    assert(majority({2, 2, 1, 1, 1, 2, 2}) == 2);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array"
    ]
  },
  {
    "id": "rotated-search",
    "title": "Binary search variants: rotated array, first and last position",
    "when": "Search a rotated sorted array; find the range of a target",
    "cost": "O(log n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint searchRotated(const vector<int>& a, int target) {   // one half is always sorted\n    int lo = 0, hi = (int)a.size() - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (a[mid] == target) return mid;\n        if (a[lo] <= a[mid]) {                             // left half sorted\n            if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {                                           // right half sorted\n            if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return -1;\n}\n\npair<int, int> searchRange(const vector<int>& a, int target) {\n    auto lo = lower_bound(a.begin(), a.end(), target), hi = upper_bound(a.begin(), a.end(), target);\n    if (lo == hi) return {-1, -1};\n    return {int(lo - a.begin()), int(hi - a.begin()) - 1};\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(searchRotated({4, 5, 6, 7, 0, 1, 2}, 0) == 4 && searchRotated({4, 5, 6, 7, 0, 1, 2}, 3) == -1 && searchRotated({1}, 1) == 0);\n    assert(searchRange({5, 7, 7, 8, 8, 10}, 8) == make_pair(3, 4) && searchRange({5, 7}, 6) == make_pair(-1, -1));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array"
    ]
  },
  {
    "id": "permutation-rotate",
    "title": "Next permutation and rotating an array",
    "when": "Next lexicographic order by hand; rotate by k in place",
    "cost": "O(n), O(1) space",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvoid nextPermutation(vector<int>& a) {             // what std::next_permutation does\n    int i = (int)a.size() - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;        // rightmost place that can still grow\n    if (i >= 0) {\n        int j = (int)a.size() - 1;\n        while (a[j] <= a[i]) j--;                  // smallest larger value to its right\n        swap(a[i], a[j]);\n    }\n    reverse(a.begin() + i + 1, a.end());           // the tail becomes the smallest order\n}\n\nvoid rotateRight(vector<int>& a, int k) {          // three reversals, no extra array\n    int n = a.size();\n    if (n == 0) return;\n    k %= n;\n    reverse(a.begin(), a.end());\n    reverse(a.begin(), a.begin() + k);\n    reverse(a.begin() + k, a.end());\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<int> p = {1, 2, 3};\n    nextPermutation(p); assert(p == vector<int>({1, 3, 2}));\n    p = {3, 2, 1}; nextPermutation(p); assert(p == vector<int>({1, 2, 3}));\n    vector<int> r = {1, 2, 3, 4, 5, 6, 7};\n    rotateRight(r, 3);\n    assert(r == vector<int>({5, 6, 7, 1, 2, 3, 4}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array"
    ]
  },
  {
    "id": "matrix",
    "title": "Matrix: spiral order and rotate 90 degrees",
    "when": "Walk a matrix in a spiral; rotate an image in place",
    "cost": "O(rows x cols)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvector<int> spiral(const vector<vector<int>>& m) {   // shrink four walls after each side\n    vector<int> out;\n    if (m.empty()) return out;\n    int top = 0, bottom = m.size() - 1, left = 0, right = m[0].size() - 1;\n    while (top <= bottom && left <= right) {\n        for (int c = left; c <= right; c++) out.push_back(m[top][c]);\n        top++;\n        for (int r = top; r <= bottom; r++) out.push_back(m[r][right]);\n        right--;\n        if (top <= bottom) { for (int c = right; c >= left; c--) out.push_back(m[bottom][c]); bottom--; }\n        if (left <= right) { for (int r = bottom; r >= top; r--) out.push_back(m[r][left]); left++; }\n    }\n    return out;\n}\n\nvoid rotate90(vector<vector<int>>& m) {            // clockwise: transpose, then reverse each row\n    int n = m.size();\n    for (int i = 0; i < n; i++)\n        for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);\n    for (auto& row : m) reverse(row.begin(), row.end());\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(spiral({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}) == vector<int>({1, 2, 3, 6, 9, 8, 7, 4, 5}));\n    assert(spiral({{1, 2, 3, 4}, {5, 6, 7, 8}}) == vector<int>({1, 2, 3, 4, 8, 7, 6, 5}));\n    vector<vector<int>> m = {{1, 2}, {3, 4}};\n    rotate90(m);\n    assert(m == (vector<vector<int>>{{3, 1}, {4, 2}}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "array",
      "logic-to-code"
    ]
  },
  {
    "id": "histogram",
    "title": "Largest rectangle in a histogram",
    "when": "Largest rectangle of bars, maximal rectangle of 1s in a matrix",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <stack>\n#include <vector>\nusing namespace std;\n\nlong long largestRectangle(vector<int> h) {\n    h.push_back(0);                                   // a 0 at the end flushes every bar\n    stack<int> st;                                     // indexes of increasing heights\n    long long best = 0;\n    for (int i = 0; i < (int)h.size(); i++) {\n        while (!st.empty() && h[st.top()] >= h[i]) {\n            int height = h[st.top()]; st.pop();\n            int width = st.empty() ? i : i - st.top() - 1;   // it stretches back to the next smaller bar\n            best = max(best, (long long)height * width);\n        }\n        st.push(i);\n    }\n    return best;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(largestRectangle({2, 1, 5, 6, 2, 3}) == 10 && largestRectangle({2, 4}) == 4 && largestRectangle({}) == 0);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "stack"
    ]
  },
  {
    "id": "rpn",
    "title": "Evaluate reverse Polish notation",
    "when": "Postfix expressions, calculators, any \"operator applies to the last two values\"",
    "cost": "O(n)",
    "code": "#include <stack>\n#include <string>\n#include <vector>\nusing namespace std;\n\nlong long evalRPN(const vector<string>& tokens) {\n    stack<long long> st;\n    for (const string& t : tokens) {\n        if (t.size() == 1 && string(\"+-*/\").find(t[0]) != string::npos) {\n            long long b = st.top(); st.pop();         // pop b first: order matters for - and /\n            long long a = st.top(); st.pop();\n            st.push(t == \"+\" ? a + b : t == \"-\" ? a - b : t == \"*\" ? a * b : a / b);   // / truncates toward zero\n        } else {\n            st.push(stoll(t));                        // \"-3\" is a number, not an operator\n        }\n    }\n    return st.top();\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(evalRPN({\"2\", \"1\", \"+\", \"3\", \"*\"}) == 9);\n    assert(evalRPN({\"4\", \"13\", \"5\", \"/\", \"+\"}) == 6);\n    assert(evalRPN({\"10\", \"-3\", \"/\"}) == -3);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "stack"
    ]
  },
  {
    "id": "list-merge",
    "title": "Linked list: merge sorted lists, remove n-th from end",
    "when": "Merging, deleting or inserting with a dummy head; two pointers n apart",
    "cost": "O(n)",
    "code": "struct ListNode {\n    int val;\n    ListNode* next;\n    explicit ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}\n};\n\nListNode* mergeSorted(ListNode* a, ListNode* b) {\n    ListNode dummy(0);                                // a dummy head removes the \"empty result\" case\n    ListNode* tail = &dummy;\n    while (a && b) {\n        ListNode*& smaller = a->val <= b->val ? a : b;\n        tail->next = smaller;\n        tail = smaller;\n        smaller = smaller->next;\n    }\n    tail->next = a ? a : b;\n    return dummy.next;\n}\n\nListNode* removeNthFromEnd(ListNode* head, int n) {\n    ListNode dummy(0, head);\n    ListNode *fast = &dummy, *slow = &dummy;\n    for (int i = 0; i <= n; i++) fast = fast->next;   // fast runs n + 1 ahead\n    while (fast) { fast = fast->next; slow = slow->next; }\n    slow->next = slow->next->next;                    // slow sits just before the one to delete\n    return dummy.next;\n}",
    "test": "#include <cassert>\n#include <iostream>\n#include <vector>\nstd::vector<int> vals(ListNode* h) { std::vector<int> v; for (; h; h = h->next) v.push_back(h->val); return v; }\nint main() {\n    ListNode a3(4), a2(2, &a3), a1(1, &a2), b3(4), b2(3, &b3), b1(1, &b2);\n    ListNode* m = mergeSorted(&a1, &b1);\n    assert(vals(m) == std::vector<int>({1, 1, 2, 3, 4, 4}));\n    ListNode c5(5), c4(4, &c5), c3(3, &c4), c2(2, &c3), c1(1, &c2);\n    assert(vals(removeNthFromEnd(&c1, 2)) == std::vector<int>({1, 2, 3, 5}));\n    ListNode d1(1);\n    assert(removeNthFromEnd(&d1, 1) == nullptr);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "linkedlist"
    ]
  },
  {
    "id": "tree-paths",
    "title": "Binary tree: diameter and maximum path sum",
    "when": "Longest path between two nodes; best sum along any path",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <climits>\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode *left = nullptr, *right = nullptr;\n    explicit TreeNode(int v) : val(v) {}\n};\n\n// each helper returns the best path going down from t, and updates the best path through t\nint depthFor(TreeNode* t, int& diameter) {\n    if (!t) return 0;\n    int l = depthFor(t->left, diameter), r = depthFor(t->right, diameter);\n    diameter = max(diameter, l + r);                  // edges on the longest path through t\n    return 1 + max(l, r);\n}\n\nint gainFor(TreeNode* t, int& best) {\n    if (!t) return 0;\n    int l = max(0, gainFor(t->left, best)), r = max(0, gainFor(t->right, best));   // drop negative branches\n    best = max(best, t->val + l + r);\n    return t->val + max(l, r);                        // a path going up can use only one side\n}\n\nint diameter(TreeNode* root) { int d = 0; depthFor(root, d); return d; }\nint maxPathSum(TreeNode* root) { int best = INT_MIN; gainFor(root, best); return best; }",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    TreeNode n1(1), n2(2), n3(3), n4(4), n5(5);\n    n1.left = &n2; n1.right = &n3; n2.left = &n4; n2.right = &n5;\n    assert(diameter(&n1) == 3);\n    TreeNode m(-10), a(9), b(20), c(15), d(7);\n    m.left = &a; m.right = &b; b.left = &c; b.right = &d;\n    assert(maxPathSum(&m) == 42);\n    TreeNode solo(-3);\n    assert(maxPathSum(&solo) == -3);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "binary-tree"
    ]
  },
  {
    "id": "lca-lifting",
    "title": "LCA with binary lifting",
    "when": "Many ancestor or distance queries on a big tree",
    "cost": "O(n log n) setup, O(log n) per query",
    "code": "#include <vector>\nusing namespace std;\n\nstruct LCA {                                          // up[k][v] = the 2^k-th ancestor of v\n    int LOG;\n    vector<int> depth;\n    vector<vector<int>> up;\n    LCA(const vector<vector<int>>& adj, int root) : LOG(1), depth(adj.size()) {\n        int n = adj.size();\n        while ((1 << LOG) < n) LOG++;\n        up.assign(LOG, vector<int>(n, root));\n        vector<int> order = {root}, seen(n, 0);       // iterative DFS: no recursion limit\n        seen[root] = 1;\n        for (size_t i = 0; i < order.size(); i++)\n            for (int v : adj[order[i]]) if (!seen[v]) {\n                seen[v] = 1; up[0][v] = order[i]; depth[v] = depth[order[i]] + 1; order.push_back(v);\n            }\n        for (int k = 1; k < LOG; k++)\n            for (int v = 0; v < n; v++) up[k][v] = up[k - 1][up[k - 1][v]];\n    }\n    int query(int a, int b) const {\n        if (depth[a] < depth[b]) swap(a, b);\n        for (int k = LOG - 1; k >= 0; k--)            // lift a to b's depth\n            if (depth[a] - (1 << k) >= depth[b]) a = up[k][a];\n        if (a == b) return a;\n        for (int k = LOG - 1; k >= 0; k--)            // lift both while they differ\n            if (up[k][a] != up[k][b]) { a = up[k][a]; b = up[k][b]; }\n        return up[0][a];\n    }\n    int dist(int a, int b) const { return depth[a] + depth[b] - 2 * depth[query(a, b)]; }\n};",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    //        0\n    //      1   2\n    //     3 4    5\n    //    6\n    vector<vector<int>> adj(7);\n    for (auto [u, v] : vector<pair<int, int>>{{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}, {3, 6}}) { adj[u].push_back(v); adj[v].push_back(u); }\n    LCA l(adj, 0);\n    assert(l.query(6, 4) == 1 && l.query(6, 5) == 0 && l.query(3, 6) == 3 && l.dist(6, 5) == 5);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "binary-tree",
      "graph"
    ]
  },
  {
    "id": "graph-checks",
    "title": "Bipartite check and cycle in a directed graph",
    "when": "Two-colouring (possible bipartition); detecting a cycle in dependencies",
    "cost": "O(V + E)",
    "code": "#include <queue>\n#include <vector>\nusing namespace std;\n\nbool isBipartite(const vector<vector<int>>& adj) {   // BFS colouring of every component\n    vector<int> color(adj.size(), -1);\n    for (int s = 0; s < (int)adj.size(); s++) {\n        if (color[s] != -1) continue;\n        queue<int> q;\n        q.push(s); color[s] = 0;\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            for (int v : adj[u]) {\n                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }\n                else if (color[v] == color[u]) return false;   // an odd cycle\n            }\n        }\n    }\n    return true;\n}\n\nbool hasDirectedCycle(const vector<vector<int>>& adj) {   // 0 unvisited, 1 on the current path, 2 done\n    vector<int> state(adj.size(), 0);\n    auto dfs = [&](auto&& self, int u) -> bool {\n        state[u] = 1;\n        for (int v : adj[u]) {\n            if (state[v] == 1) return true;               // back to a node on the path: a cycle\n            if (state[v] == 0 && self(self, v)) return true;\n        }\n        state[u] = 2;\n        return false;\n    };\n    for (int u = 0; u < (int)adj.size(); u++) if (state[u] == 0 && dfs(dfs, u)) return true;\n    return false;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(isBipartite({{1, 3}, {0, 2}, {1, 3}, {0, 2}}) && !isBipartite({{1, 2}, {0, 2}, {0, 1}}));\n    assert(hasDirectedCycle({{1}, {2}, {0}}) && !hasDirectedCycle({{1, 2}, {2}, {}}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "bellman-ford",
    "title": "Bellman-Ford",
    "when": "Shortest paths with negative edges; detect a negative cycle; cheapest flight within k stops",
    "cost": "O(V x E)",
    "code": "#include <array>\n#include <climits>\n#include <vector>\nusing namespace std;\n\n// returns false if a negative cycle is reachable from src\nbool bellmanFord(int n, const vector<array<int, 3>>& edges, int src, vector<long long>& dist) {   // edges {u, v, w}\n    dist.assign(n, LLONG_MAX);\n    dist[src] = 0;\n    for (int round = 0; round < n - 1; round++)          // n - 1 rounds settle every shortest path\n        for (auto [u, v, w] : edges)\n            if (dist[u] != LLONG_MAX && dist[u] + w < dist[v]) dist[v] = dist[u] + w;\n    for (auto [u, v, w] : edges)                         // anything still improving lies on a negative cycle\n        if (dist[u] != LLONG_MAX && dist[u] + w < dist[v]) return false;\n    return true;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    vector<long long> d;\n    assert(bellmanFord(4, {{0, 1, 4}, {0, 2, 5}, {1, 2, -3}, {2, 3, 2}}, 0, d));\n    assert(d == vector<long long>({0, 4, 1, 3}));\n    assert(!bellmanFord(3, {{0, 1, 1}, {1, 2, -2}, {2, 1, 1}}, 0, d));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "graph"
    ]
  },
  {
    "id": "dp-1d",
    "title": "1D DP: house robber and decode ways",
    "when": "Choose or skip each element; count ways to read a string",
    "cost": "O(n), O(1) space",
    "code": "#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint rob(const vector<int>& a) {                      // best total with no two adjacent houses\n    int take = 0, skip = 0;                           // best ending with this house taken / skipped\n    for (int x : a) {\n        int newTake = skip + x;\n        skip = max(skip, take);\n        take = newTake;\n    }\n    return max(take, skip);\n}\n\nint numDecodings(const string& s) {                  // '1' to '26' map to letters\n    int prev2 = 1, prev1 = s.empty() || s[0] == '0' ? 0 : 1;   // ways for prefixes of length i - 2 and i - 1\n    for (size_t i = 2; i <= s.size(); i++) {\n        int cur = 0;\n        if (s[i - 1] != '0') cur += prev1;            // read one digit\n        int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');\n        if (s[i - 2] != '0' && two <= 26) cur += prev2;   // read two digits\n        prev2 = prev1;\n        prev1 = cur;\n    }\n    return prev1;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(rob({2, 7, 9, 3, 1}) == 12 && rob({}) == 0);\n    assert(numDecodings(\"226\") == 3 && numDecodings(\"06\") == 0 && numDecodings(\"12\") == 2 && numDecodings(\"10\") == 1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp"
    ]
  },
  {
    "id": "dp-grid",
    "title": "Grid DP: unique paths and minimum path sum",
    "when": "Moving only right and down; obstacles; cheapest route",
    "cost": "O(rows x cols)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nlong long uniquePaths(const vector<vector<int>>& g) {   // 1 marks an obstacle\n    int R = g.size(), C = g[0].size();\n    vector<long long> dp(C, 0);                          // one row is enough\n    dp[0] = g[0][0] == 0;\n    for (int r = 0; r < R; r++)\n        for (int c = 0; c < C; c++) {\n            if (g[r][c] == 1) dp[c] = 0;\n            else if (c > 0) dp[c] += dp[c - 1];          // from above (old dp[c]) plus from the left\n        }\n    return dp[C - 1];\n}\n\nint minPathSum(vector<vector<int>> g) {\n    int R = g.size(), C = g[0].size();\n    for (int r = 0; r < R; r++)\n        for (int c = 0; c < C; c++) {\n            if (r == 0 && c == 0) continue;\n            int up = r > 0 ? g[r - 1][c] : 1e9, left = c > 0 ? g[r][c - 1] : 1e9;\n            g[r][c] += min(up, left);\n        }\n    return g[R - 1][C - 1];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(uniquePaths({{0, 0, 0}, {0, 1, 0}, {0, 0, 0}}) == 2 && uniquePaths({{0, 0, 0, 0, 0, 0, 0}, {0, 0, 0, 0, 0, 0, 0}, {0, 0, 0, 0, 0, 0, 0}}) == 28);\n    assert(minPathSum({{1, 3, 1}, {1, 5, 1}, {4, 2, 1}}) == 7);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp"
    ]
  },
  {
    "id": "subset-sum",
    "title": "Subset sum and equal partition",
    "when": "Can some items reach a target sum; split into two equal halves",
    "cost": "O(n x sum), or O(n x sum / 64) with bitset",
    "code": "#include <bitset>\n#include <numeric>\n#include <vector>\nusing namespace std;\n\nbool subsetSum(const vector<int>& a, int target) {\n    vector<bool> can(target + 1, false);\n    can[0] = true;\n    for (int x : a)\n        for (int s = target; s >= x; s--)             // backwards: each number used once\n            if (can[s - x]) can[s] = true;\n    return can[target];\n}\n\nbool canPartition(const vector<int>& a) {            // the bitset trick: shift-or adds a number to every reachable sum\n    int total = accumulate(a.begin(), a.end(), 0);\n    if (total % 2) return false;\n    bitset<20001> reach;                              // sums up to 20000\n    reach[0] = 1;\n    for (int x : a) reach |= reach << x;\n    return reach[total / 2];\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(subsetSum({3, 34, 4, 12, 5, 2}, 9) && !subsetSum({3, 34, 4, 12, 5, 2}, 30));\n    assert(canPartition({1, 5, 11, 5}) && !canPartition({1, 2, 3, 5}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp",
      "bit-and-math"
    ]
  },
  {
    "id": "bitmask-dp",
    "title": "Bitmask DP: travelling salesman",
    "when": "Visit every node once with n up to about 16; assignment problems",
    "cost": "O(2^n x n^2)",
    "code": "#include <algorithm>\n#include <climits>\n#include <vector>\nusing namespace std;\n\nint tsp(const vector<vector<int>>& d) {              // shortest tour from 0 through every city and back\n    int n = d.size(), FULL = 1 << n;\n    vector<vector<int>> dp(FULL, vector<int>(n, INT_MAX / 2));   // dp[mask][v]: visited mask, standing at v\n    dp[1][0] = 0;\n    for (int mask = 1; mask < FULL; mask++)\n        for (int v = 0; v < n; v++) {\n            if (!(mask >> v & 1) || dp[mask][v] >= INT_MAX / 2) continue;\n            for (int u = 0; u < n; u++) if (!(mask >> u & 1))\n                dp[mask | 1 << u][u] = min(dp[mask | 1 << u][u], dp[mask][v] + d[v][u]);\n        }\n    int best = INT_MAX;\n    for (int v = 0; v < n; v++) best = min(best, dp[FULL - 1][v] + d[v][0]);\n    return best;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(tsp({{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}}) == 80);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "dp",
      "bit-and-math"
    ]
  },
  {
    "id": "rolling-hash",
    "title": "Rolling hash (Rabin-Karp)",
    "when": "Compare substrings in O(1); repeated substrings; longest duplicate with binary search",
    "cost": "O(n) setup, O(1) per substring",
    "code": "#include <string>\n#include <vector>\nusing namespace std;\n\nstruct Hasher {                                       // polynomial hash mod a large prime\n    static constexpr long long MOD = 1'000'000'007, BASE = 131;\n    vector<long long> h, pw;\n    explicit Hasher(const string& s) : h(s.size() + 1, 0), pw(s.size() + 1, 1) {\n        for (size_t i = 0; i < s.size(); i++) {\n            h[i + 1] = (h[i] * BASE + (unsigned char)s[i]) % MOD;\n            pw[i + 1] = pw[i] * BASE % MOD;\n        }\n    }\n    long long get(int l, int r) const {               // hash of s[l, r)\n        return ((h[r] - h[l] * pw[r - l]) % MOD + MOD) % MOD;\n    }\n};\n\nvector<int> findAllHash(const string& text, const string& pat) {   // compare hashes, then confirm (collisions are possible)\n    vector<int> res;\n    if (pat.size() > text.size()) return res;\n    Hasher t(text), p(pat);\n    long long target = p.get(0, pat.size());\n    for (size_t i = 0; i + pat.size() <= text.size(); i++)\n        if (t.get(i, i + pat.size()) == target && text.compare(i, pat.size(), pat) == 0) res.push_back(i);\n    return res;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    Hasher h(\"abcabc\");\n    assert(h.get(0, 3) == h.get(3, 6) && h.get(0, 2) != h.get(1, 3));\n    assert(findAllHash(\"abababa\", \"aba\") == vector<int>({0, 2, 4}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "string"
    ]
  },
  {
    "id": "z-function",
    "title": "Z-function",
    "when": "Pattern matching, string periods, counting prefix occurrences",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <string>\n#include <vector>\nusing namespace std;\n\nvector<int> zFunction(const string& s) {             // z[i] = longest common prefix of s and s[i..]\n    int n = s.size();\n    vector<int> z(n, 0);\n    for (int i = 1, l = 0, r = 0; i < n; i++) {\n        if (i < r) z[i] = min(r - i, z[i - l]);        // reuse the box [l, r) we already matched\n        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;\n        if (i + z[i] > r) { l = i; r = i + z[i]; }\n    }\n    return z;\n}\n\nint smallestPeriod(const string& s) {                 // shortest p with s made of repeats of s[0, p)\n    vector<int> z = zFunction(s);\n    int n = s.size();\n    for (int p = 1; p < n; p++) if (n % p == 0 && p + z[p] == n) return p;\n    return n;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(zFunction(\"aabxaab\") == vector<int>({0, 1, 0, 0, 3, 1, 0}));\n    assert(smallestPeriod(\"abcabcabc\") == 3 && smallestPeriod(\"aaaa\") == 1 && smallestPeriod(\"abcd\") == 4);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "string"
    ]
  },
  {
    "id": "ext-gcd",
    "title": "Extended gcd and inverse for any modulus",
    "when": "Solve ax + by = gcd; modular inverse when the modulus is not prime",
    "cost": "O(log n)",
    "code": "#include <tuple>\nusing namespace std;\n\nlong long extGcd(long long a, long long b, long long& x, long long& y) {   // a*x + b*y = gcd(a, b)\n    if (b == 0) { x = 1; y = 0; return a; }\n    long long x1, y1;\n    long long g = extGcd(b, a % b, x1, y1);\n    x = y1;\n    y = x1 - (a / b) * y1;\n    return g;\n}\n\nlong long modInverse(long long a, long long m) {     // -1 if a and m share a factor\n    long long x, y;\n    if (extGcd(((a % m) + m) % m, m, x, y) != 1) return -1;\n    return ((x % m) + m) % m;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    long long x, y;\n    assert(extGcd(30, 12, x, y) == 6 && 30 * x + 12 * y == 6);\n    assert(modInverse(3, 10) == 7 && modInverse(4, 10) == -1 && modInverse(10, 17) * 10 % 17 == 1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "bit-and-math"
    ]
  },
  {
    "id": "count-bits",
    "title": "Counting bits for every number, Gray code",
    "when": "Set bits of 0..n in O(n); sequences where neighbours differ by one bit",
    "cost": "O(n)",
    "code": "#include <vector>\nusing namespace std;\n\nvector<int> countBits(int n) {                       // bits(i) = bits(i / 2) + lowest bit\n    vector<int> bits(n + 1, 0);\n    for (int i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);\n    return bits;\n}\n\nvector<int> grayCode(int n) {                        // i ^ (i >> 1) changes exactly one bit each step\n    vector<int> out;\n    for (int i = 0; i < (1 << n); i++) out.push_back(i ^ (i >> 1));\n    return out;\n}",
    "test": "#include <bit>\n#include <cassert>\n#include <iostream>\nint main() {\n    assert(countBits(5) == vector<int>({0, 1, 1, 2, 1, 2}));\n    vector<int> g = grayCode(3);\n    assert(g == vector<int>({0, 1, 3, 2, 6, 7, 5, 4}));\n    for (size_t i = 1; i < g.size(); i++) assert(std::popcount(unsigned(g[i] ^ g[i - 1])) == 1);\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "bit-and-math"
    ]
  },
  {
    "id": "insert-interval",
    "title": "Insert into sorted intervals",
    "when": "Add a new interval to a sorted, non-overlapping list and merge",
    "cost": "O(n)",
    "code": "#include <algorithm>\n#include <vector>\nusing namespace std;\n\nvector<pair<int, int>> insertInterval(const vector<pair<int, int>>& v, pair<int, int> add) {\n    vector<pair<int, int>> out;\n    size_t i = 0;\n    while (i < v.size() && v[i].second < add.first) out.push_back(v[i++]);      // entirely before\n    while (i < v.size() && v[i].first <= add.second) {                          // overlapping: grow add\n        add.first = min(add.first, v[i].first);\n        add.second = max(add.second, v[i].second);\n        i++;\n    }\n    out.push_back(add);\n    while (i < v.size()) out.push_back(v[i++]);                                 // entirely after\n    return out;\n}",
    "test": "#include <cassert>\n#include <iostream>\nint main() {\n    assert(insertInterval({{1, 3}, {6, 9}}, {2, 5}) == (vector<pair<int, int>>{{1, 5}, {6, 9}}));\n    assert(insertInterval({{1, 2}, {3, 5}, {6, 7}, {8, 10}, {12, 16}}, {4, 8}) == (vector<pair<int, int>>{{1, 2}, {3, 10}, {12, 16}}));\n    assert(insertInterval({}, {5, 7}) == (vector<pair<int, int>>{{5, 7}}));\n    std::cout << \"ok\\n\";\n}",
    "topics": [
      "intervals"
    ]
  }
];
