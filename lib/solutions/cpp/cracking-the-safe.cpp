class Solution {
public:
    string crackSafe(int n, int k) {
        string start(n - 1, '0'), out;
        unordered_map<string, int> left;                     // node -> digits not yet typed from it
        vector<pair<string, char>> st = {{start, 0}};
        while (!st.empty()) {
            string node = st.back().first;
            if (!left.count(node)) left[node] = k;
            if (left[node]) {
                char d = '0' + --left[node];
                st.push_back({(node + d).substr(1), d});
            } else {
                if (st.back().second) out += st.back().second;
                st.pop_back();
            }
        }
        reverse(out.begin(), out.end());
        return start + out;
    }
};
// @test
    auto ok = [](const string& s, int n, int k) {
        int total = 1;
        for (int i = 0; i < n; i++) total *= k;
        set<string> codes;
        for (size_t i = 0; i + n <= s.size(); i++) codes.insert(s.substr(i, n));
        for (char c : s) if (c < '0' || c >= '0' + k) return false;
        return (int)s.size() == total + n - 1 && (int)codes.size() == total;
    };
    for (auto [n, k] : vector<pair<int, int>>{{1, 2}, {2, 2}, {1, 1}, {3, 2}, {2, 10}, {4, 4}})
        H::check(ok(Solution().crackSafe(n, k), n, k), true, "crackSafe(" + to_string(n) + ", " + to_string(k) + ")");
