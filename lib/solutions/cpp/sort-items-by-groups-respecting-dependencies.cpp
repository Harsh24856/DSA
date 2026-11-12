class Solution {
    // Kahn's algorithm; empty when there is a cycle
    vector<int> topo(int count, vector<vector<int>>& edges) {
        vector<int> indeg(count, 0), out;
        for (auto& to : edges) for (int b : to) indeg[b]++;
        queue<int> q;
        for (int x = 0; x < count; x++) if (indeg[x] == 0) q.push(x);
        while (!q.empty()) {
            int x = q.front(); q.pop();
            out.push_back(x);
            for (int y : edges[x]) if (--indeg[y] == 0) q.push(y);
        }
        return (int)out.size() == count ? out : vector<int>{};
    }
public:
    vector<int> sortItems(int n, int m, vector<int>& group, vector<vector<int>>& beforeItems) {
        for (int i = 0; i < n; i++)
            if (group[i] == -1) group[i] = m++;            // an ungrouped item gets its own group
        vector<vector<int>> itemEdges(n), groupEdges(m);
        for (int a = 0; a < n; a++)
            for (int b : beforeItems[a]) {
                itemEdges[b].push_back(a);
                if (group[a] != group[b]) groupEdges[group[b]].push_back(group[a]);
            }
        vector<int> items = topo(n, itemEdges), groups = topo(m, groupEdges);
        if (items.empty() || groups.empty()) return {};
        vector<vector<int>> byGroup(m);
        for (int x : items) byGroup[group[x]].push_back(x);
        vector<int> out;
        for (int g : groups) for (int x : byGroup[g]) out.push_back(x);
        return out;
    }
};
// @test
    auto valid = [](int n, vector<int> group, vector<vector<int>> before, vector<int> out) {
        if (H::sorted(out) != [&] { vector<int> r(n); iota(r.begin(), r.end(), 0); return r; }()) return false;
        vector<int> at(n);
        for (int i = 0; i < n; i++) at[out[i]] = i;
        for (int a = 0; a < n; a++) for (int b : before[a]) if (at[b] > at[a]) return false;
        set<long long> seen; long long last = LLONG_MIN;
        for (int x : out) {
            long long g = group[x] != -1 ? group[x] : -1 - x;   // ungrouped items are solo groups
            if (g != last && seen.count(g)) return false;
            seen.insert(g); last = g;
        }
        return true;
    };
    vector<int> g1{-1,-1,1,0,0,1,0,-1}; vector<vector<int>> b1{{},{6},{5},{6},{3,6},{},{},{}};
    vector<int> g1c = g1; vector<vector<int>> b1c = b1;
    H::check(valid(8, g1, b1, Solution().sortItems(8, 2, g1c, b1c)), true, "sortItems a");
    vector<int> g2{-1,-1,1,0,0,1,0,-1}; vector<vector<int>> b2{{},{6},{5},{6},{3},{},{4},{}};
    H::check(Solution().sortItems(8, 2, g2, b2), vector<int>{}, "sortItems b");
