class Solution {
public:
    int numTrees(int n) {
        vector<long long> G(n + 1, 0);                   // G[m]: trees with m nodes
        G[0] = 1;
        if (n >= 1) G[1] = 1;
        for (int m = 2; m <= n; m++)
            for (int root = 1; root <= m; root++) G[m] += G[root - 1] * G[m - root];   // left times right
        return G[n];
    }
};
