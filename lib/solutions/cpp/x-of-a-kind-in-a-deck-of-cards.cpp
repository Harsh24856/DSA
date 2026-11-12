class Solution {
public:
    bool hasGroupsSizeX(vector<int>& deck) {
        unordered_map<int, int> cnt;
        for (int x : deck) cnt[x]++;
        int g = 0;
        for (auto& [card, c] : cnt) g = gcd(g, c);           // group size must divide every count
        return g >= 2;
    }
};
