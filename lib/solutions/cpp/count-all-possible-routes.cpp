class Solution {
public:
    int countRoutes(vector<int>& locations, int start, int finish, int fuel) {
        const int MOD = 1e9 + 7;
        int n = locations.size();
        vector<vector<int>> memo(n, vector<int>(fuel + 1, -1));
        // routes from city to finish with f fuel left
        function<int(int, int)> ways = [&](int city, int f) {
            int& res = memo[city][f];
            if (res >= 0) return res;
            long long total = city == finish;   // stopping here counts as a route
            for (int nxt = 0; nxt < n; nxt++) {
                int cost = abs(locations[nxt] - locations[city]);
                if (nxt != city && cost <= f) total += ways(nxt, f - cost);
            }
            return res = total % MOD;
        };
        return ways(start, fuel);
    }
};
