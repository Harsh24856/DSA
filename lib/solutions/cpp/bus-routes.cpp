class Solution {
public:
    int numBusesToDestination(vector<vector<int>>& routes, int source, int target) {
        if (source == target) return 0;
        unordered_map<int, vector<int>> buses;   // stop -> buses through it
        for (int b = 0; b < (int)routes.size(); b++)
            for (int s : routes[b]) buses[s].push_back(b);
        queue<pair<int, int>> q;   // (stop, buses taken)
        q.push({source, 0});
        unordered_set<int> used, seen{source};
        while (!q.empty()) {
            auto [s, d] = q.front();
            q.pop();
            for (int b : buses[s]) {
                if (!used.insert(b).second) continue;   // each bus is ridden once
                for (int t : routes[b]) {
                    if (t == target) return d + 1;
                    if (seen.insert(t).second) q.push({t, d + 1});
                }
            }
        }
        return -1;
    }
};
