class Solution {
public:
    int smallestDistancePair(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        int lo = 0, hi = nums.back() - nums[0];
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            long long cnt = 0;
            for (int l = 0, r = 0; r < (int)nums.size(); r++) {
                while (nums[r] - nums[l] > mid) l++;
                cnt += r - l;            // pairs ending at r with distance <= mid
            }
            if (cnt >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
