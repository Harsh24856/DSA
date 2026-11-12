class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        int best = nums[0] + nums[1] + nums[2];
        for (int i = 0; i + 2 < (int)nums.size(); i++) {
            int j = i + 1, k = nums.size() - 1;
            while (j < k) {   // two pointers on the sorted rest
                int s = nums[i] + nums[j] + nums[k];
                if (abs(s - target) < abs(best - target)) best = s;
                if (s < target) j++;
                else if (s > target) k--;
                else return s;   // exact hit
            }
        }
        return best;
    }
};
