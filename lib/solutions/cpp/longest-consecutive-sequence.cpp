class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        int best = 0;
        for (int x : s)
            if (!s.count(x - 1)) {                         // x starts a run
                int y = x;
                while (s.count(y + 1)) y++;
                best = max(best, y - x + 1);
            }
        return best;
    }
};
