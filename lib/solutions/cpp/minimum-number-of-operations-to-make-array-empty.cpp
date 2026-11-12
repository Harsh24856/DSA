class Solution {
public:
    int minOperations(vector<int>& nums) {
        unordered_map<int, int> cnt;
        for (int x : nums) cnt[x]++;
        int ops = 0;
        for (auto& [v, c] : cnt) {
            if (c == 1) return -1;
            ops += (c + 2) / 3;   // as many triples as possible, pairs for the rest
        }
        return ops;
    }
};
