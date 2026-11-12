class Solution {
public:
    int maxOperations(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        int i = 0, j = nums.size() - 1, ops = 0;
        while (i < j) {
            long long s = (long long)nums[i] + nums[j];
            if (s == k) { ops++; i++; j--; }
            else if (s < k) i++;   // need a bigger sum
            else j--;
        }
        return ops;
    }
};
