class Solution {
public:
    long long countBadPairs(vector<int>& nums) {
        unordered_map<int, long long> seen;   // x - i equal means a good pair
        long long good = 0;
        for (int i = 0; i < (int)nums.size(); i++) good += seen[nums[i] - i]++;
        long long n = nums.size();
        return n * (n - 1) / 2 - good;
    }
};
