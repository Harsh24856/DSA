class Solution {
    static constexpr int B = 15;
    vector<array<int, 3>> trie = {{0, 0, 0}};           // children for bit 0 and 1, then how many numbers pass

    void insert(int x) {
        int cur = 0;
        for (int b = B - 1; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (!trie[cur][bit]) { trie.push_back({0, 0, 0}); trie[cur][bit] = trie.size() - 1; }
            cur = trie[cur][bit];
            trie[cur][2]++;
        }
    }

    int less(int x, int limit) {                         // numbers y in the trie with x ^ y < limit
        int cur = 0, total = 0;
        for (int b = B - 1; b >= 0; b--) {
            int xb = (x >> b) & 1, lb = (limit >> b) & 1;
            if (lb) {
                int same = trie[cur][xb];                // this bit of x ^ y is 0 < 1: all of them count
                if (same) total += trie[same][2];
                cur = trie[cur][1 - xb];
            } else {
                cur = trie[cur][xb];
            }
            if (!cur) break;
        }
        return total;
    }

public:
    int countPairs(vector<int>& nums, int low, int high) {
        int ans = 0;
        for (int x : nums) {
            ans += less(x, high + 1) - less(x, low);     // pairs with an earlier number
            insert(x);
        }
        return ans;
    }
};
