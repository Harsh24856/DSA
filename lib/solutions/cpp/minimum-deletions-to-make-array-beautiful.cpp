class Solution {
public:
    int minDeletion(vector<int>& nums) {
        int deleted = 0, kept = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (kept % 2 == 1 && nums[i] == nums[i - 1]) deleted++;   // would break the pair
            else kept++;
        }
        return deleted + kept % 2;   // an odd length drops the last one
    }
};
