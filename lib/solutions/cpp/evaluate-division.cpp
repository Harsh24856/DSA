class Solution {
    unordered_map<string, vector<pair<string, double>>> g;

    double ratio(const string& x, const string& y, unordered_set<string>& seen) {
        if (x == y) return 1.0;
        seen.insert(x);
        for (auto& [z, v] : g[x])
            if (!seen.count(z)) {
                double r = ratio(z, y, seen);
                if (r != -1.0) return v * r;             // found a path through z
            }
        return -1.0;
    }

public:
    vector<double> calcEquation(vector<vector<string>>& equations, vector<double>& values, vector<vector<string>>& queries) {
        for (size_t i = 0; i < equations.size(); i++) {
            auto& a = equations[i][0]; auto& b = equations[i][1];
            g[a].push_back({b, values[i]});
            g[b].push_back({a, 1 / values[i]});
        }
        vector<double> out;
        for (auto& q : queries) {
            unordered_set<string> seen;
            out.push_back(g.count(q[0]) && g.count(q[1]) ? ratio(q[0], q[1], seen) : -1.0);
        }
        return out;
    }
};
