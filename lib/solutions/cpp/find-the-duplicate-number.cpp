class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int slow = nums[0], fast = nums[0];
        do {                                               // i -> nums[i] is a list with a cycle
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);
        slow = nums[0];
        while (slow != fast) {                             // they meet at the cycle entrance
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
};
