class Solution {
public:
    int minPatches(vector<int>& nums, int n) {
        long long miss = 1;            // every sum below miss can be made
        int i = 0, patches = 0;
        while (miss <= n) {
            if (i < (int)nums.size() && nums[i] <= miss) miss += nums[i++];
            else {
                miss += miss;          // patch with miss itself
                patches++;
            }
        }
        return patches;
    }
};
