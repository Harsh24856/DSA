class Solution {
public:
    int minimumRounds(vector<int>& tasks) {
        unordered_map<int, int> cnt;
        for (int t : tasks) cnt[t]++;
        int ans = 0;
        for (auto& [t, c] : cnt) {
            if (c == 1) return -1;
            ans += (c + 2) / 3;     // as many 3s as possible, a 2 or two to finish
        }
        return ans;
    }
};
