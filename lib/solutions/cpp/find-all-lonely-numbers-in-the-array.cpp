class Solution {
public:
    vector<int> findLonely(vector<int>& nums) {
        unordered_map<int, int> cnt;
        for (int x : nums) cnt[x]++;
        vector<int> out;
        for (int x : nums)
            if (cnt[x] == 1 && !cnt.count(x - 1) && !cnt.count(x + 1)) out.push_back(x);
        return out;
    }
};
