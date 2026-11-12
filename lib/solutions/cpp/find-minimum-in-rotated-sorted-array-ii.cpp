class Solution {
public:
    int findMin(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;   // the drop is to the right of mid
            else if (nums[mid] < nums[hi]) hi = mid;
            else hi--;                                // equal: hi can go, mid keeps its value
        }
        return nums[lo];
    }
};
