class Solution {
public:
    int numSubarrayBoundedMax(vector<int>& nums, int left, int right) {
        int bad = -1, good = -1, ans = 0;   // last index above right, last index in range
        for (int i = 0; i < (int)nums.size(); i++) {
            int x = nums[i];
            if (x > right) bad = i;
            if (left <= x && x <= right) good = i;
            ans += max(0, good - bad);      // starts after bad that still include good
        }
        return ans;
    }
};
