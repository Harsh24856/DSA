class Solution {
public:
    int openLock(vector<string>& deadends, string target) {
        unordered_set<string> dead(deadends.begin(), deadends.end());
        if (dead.count("0000")) return -1;
        unordered_set<string> seen{"0000"};
        queue<pair<string, int>> q;
        q.push({"0000", 0});
        while (!q.empty()) {
            auto [s, d] = q.front(); q.pop();
            if (s == target) return d;
            for (int i = 0; i < 4; i++)
                for (int step : {1, 9}) {                 // +1 or -1 on wheel i
                    string t = s;
                    t[i] = char('0' + (s[i] - '0' + step) % 10);
                    if (!dead.count(t) && seen.insert(t).second) q.push({t, d + 1});
                }
        }
        return -1;
    }
};
