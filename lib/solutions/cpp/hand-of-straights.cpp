class Solution {
public:
    bool isNStraightHand(vector<int>& hand, int groupSize) {
        map<int, int> cnt;                               // sorted by card value
        for (int x : hand) cnt[x]++;
        for (auto& [x, k] : cnt) {
            if (!k) continue;
            int need = k;                                // every group starting at x
            for (int y = x; y < x + groupSize; y++) {
                auto it = cnt.find(y);
                if (it == cnt.end() || it->second < need) return false;
                it->second -= need;
            }
        }
        return true;
    }
};
