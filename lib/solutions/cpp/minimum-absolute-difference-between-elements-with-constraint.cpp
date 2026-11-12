class Solution {
public:
    int minAbsoluteDifference(vector<int>& nums, int x) {
        multiset<int> seen;   // values at least x positions back
        int best = INT_MAX;
        for (int i = x; i < (int)nums.size(); i++) {
            seen.insert(nums[i - x]);
            auto it = seen.lower_bound(nums[i]);
            if (it != seen.end()) best = min(best, *it - nums[i]);              // closest above
            if (it != seen.begin()) best = min(best, nums[i] - *prev(it));      // closest below
        }
        return best;
    }
};
