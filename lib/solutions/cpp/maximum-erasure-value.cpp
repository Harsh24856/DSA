class Solution {
public:
    int maximumUniqueSubarray(vector<int>& nums) {
        unordered_set<int> seen;
        int left = 0, cur = 0, best = 0;
        for (int x : nums) {
            while (seen.count(x)) {   // shrink until x is unique in the window
                seen.erase(nums[left]);
                cur -= nums[left++];
            }
            seen.insert(x);
            cur += x;
            best = max(best, cur);
        }
        return best;
    }
};
