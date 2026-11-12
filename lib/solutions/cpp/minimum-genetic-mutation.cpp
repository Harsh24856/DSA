class Solution {
public:
    int minMutation(string startGene, string endGene, vector<string>& bank) {
        unordered_set<string> pool(bank.begin(), bank.end()), seen{startGene};
        queue<pair<string, int>> q;
        q.push({startGene, 0});
        while (!q.empty()) {
            auto [g, d] = q.front();
            q.pop();
            if (g == endGene) return d;
            for (size_t i = 0; i < g.size(); i++)
                for (char ch : string("ACGT")) {
                    string n = g;
                    n[i] = ch;                       // one letter changed
                    if (pool.count(n) && !seen.count(n)) {
                        seen.insert(n);
                        q.push({n, d + 1});
                    }
                }
        }
        return -1;
    }
};
