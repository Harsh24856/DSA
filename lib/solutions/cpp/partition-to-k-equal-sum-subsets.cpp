class Solution {
    vector<int> nums, buckets;
    int target = 0;
    bool place(size_t i) {
        if (i == nums.size()) return true;
        for (int& b : buckets) {
            if (b + nums[i] <= target) {
                b += nums[i];
                if (place(i + 1)) return true;
                b -= nums[i];
            }
            if (b == 0) break;                               // empty buckets are all alike: try one
        }
        return false;
    }
public:
    bool canPartitionKSubsets(vector<int>& nums, int k) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % k) return false;
        target = total / k;
        this->nums = nums;
        sort(this->nums.rbegin(), this->nums.rend());        // big numbers first fail faster
        if (this->nums[0] > target) return false;
        buckets.assign(k, 0);
        return place(0);
    }
};
