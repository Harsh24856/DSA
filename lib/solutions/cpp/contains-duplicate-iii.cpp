class Solution {
    static long long floorDiv(long long a, long long b) { return a / b - (a % b != 0 && (a < 0) != (b < 0)); }
public:
    bool containsNearbyAlmostDuplicate(vector<int>& nums, int indexDiff, int valueDiff) {
        long long w = (long long)valueDiff + 1;          // bucket width
        unordered_map<long long, long long> buckets;     // bucket id -> the value in it
        for (int i = 0; i < (int)nums.size(); i++) {
            long long x = nums[i], b = floorDiv(x, w);
            if (buckets.count(b)) return true;          // same bucket: close enough
            if (buckets.count(b - 1) && x - buckets[b - 1] <= valueDiff) return true;
            if (buckets.count(b + 1) && buckets[b + 1] - x <= valueDiff) return true;
            buckets[b] = x;
            if (i >= indexDiff) buckets.erase(floorDiv(nums[i - indexDiff], w));   // keep the window
        }
        return false;
    }
};
