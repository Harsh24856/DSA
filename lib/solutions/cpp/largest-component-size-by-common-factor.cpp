class Solution {
    unordered_map<int, int> parent;
    int find(int x) {
        if (!parent.count(x)) parent[x] = x;
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    void unite(int a, int b) { parent[find(a)] = find(b); }
public:
    int largestComponentSize(vector<int>& nums) {
        for (int x : nums) {
            int y = x;
            for (int p = 2; p * p <= y; p++) {
                if (y % p == 0) {
                    unite(x, -p);          // primes stored as negative keys
                    while (y % p == 0) y /= p;
                }
            }
            if (y > 1) unite(x, -y);
        }
        unordered_map<int, int> size;
        int best = 0;
        for (int x : nums) best = max(best, ++size[find(x)]);
        return best;
    }
};
