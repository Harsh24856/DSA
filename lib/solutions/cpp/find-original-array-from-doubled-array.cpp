class Solution {
public:
    vector<int> findOriginalArray(vector<int>& changed) {
        if (changed.size() % 2) return {};
        unordered_map<int, int> cnt;
        for (int x : changed) cnt[x]++;
        sort(changed.begin(), changed.end());
        vector<int> out;
        for (int x : changed) {
            if (cnt[x] == 0) continue;                       // already used as a double
            if (cnt[2 * x] == 0 || (x == 0 && cnt[0] < 2)) return {};
            cnt[x]--;
            cnt[2 * x]--;
            out.push_back(x);
        }
        return out;
    }
};
