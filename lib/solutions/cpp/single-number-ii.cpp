class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int ones = 0, twos = 0;    // bits seen once and twice (mod 3)
        for (int x : nums) {
            ones = (ones ^ x) & ~twos;
            twos = (twos ^ x) & ~ones;
        }
        return ones;
    }
};
