class Solution {
public:
    long long minimumCost(string source, string target, vector<char>& original, vector<char>& changed, vector<int>& cost) {
        const long long INF = LLONG_MAX / 4;
        vector<vector<long long>> d(26, vector<long long>(26, INF));
        for (int i = 0; i < 26; i++) d[i][i] = 0;
        for (size_t i = 0; i < original.size(); i++) {
            int u = original[i] - 'a', v = changed[i] - 'a';
            d[u][v] = min(d[u][v], (long long)cost[i]);
        }
        for (int k = 0; k < 26; k++)   // Floyd-Warshall over the 26 letters
            for (int i = 0; i < 26; i++)
                for (int j = 0; j < 26; j++) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
        long long total = 0;
        for (size_t i = 0; i < source.size(); i++) {
            long long c = d[source[i] - 'a'][target[i] - 'a'];
            if (c >= INF) return -1;
            total += c;
        }
        return total;
    }
};
