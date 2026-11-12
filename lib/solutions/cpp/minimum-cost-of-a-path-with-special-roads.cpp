class Solution {
public:
    int minimumCost(vector<int>& start, vector<int>& target, vector<vector<int>>& specialRoads) {
        int tx = target[0], ty = target[1];
        map<pair<int, int>, int> dist{{{start[0], start[1]}, 0}};
        set<pair<int, int>> done;
        priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> pq;
        pq.push({0, start[0], start[1]});
        int best = abs(tx - start[0]) + abs(ty - start[1]);
        while (!pq.empty()) {                     // Dijkstra over road ends
            auto [d, x, y] = pq.top();
            pq.pop();
            if (!done.insert({x, y}).second) continue;
            best = min(best, d + abs(tx - x) + abs(ty - y));   // walk straight to the target
            for (auto& r : specialRoads) {
                int nd = d + abs(r[0] - x) + abs(r[1] - y) + r[4];
                auto it = dist.find({r[2], r[3]});
                if (it == dist.end() || nd < it->second) {
                    dist[{r[2], r[3]}] = nd;
                    pq.push({nd, r[2], r[3]});
                }
            }
        }
        return best;
    }
};
