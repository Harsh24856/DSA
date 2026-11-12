class Solution {
public:
    int numPairsDivisibleBy60(vector<int>& time) {
        int cnt[60] = {}, ans = 0;
        for (int t : time) {
            ans += cnt[(60 - t % 60) % 60];   // earlier songs that complete this one
            cnt[t % 60]++;
        }
        return ans;
    }
};
