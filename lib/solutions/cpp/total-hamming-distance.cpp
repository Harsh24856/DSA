class Solution {
public:
    int totalHammingDistance(vector<int>& nums) {
        int n = nums.size(), total = 0;
        for (int b = 0; b < 32; b++) {
            int ones = 0;
            for (int x : nums) ones += x >> b & 1;
            total += ones * (n - ones);   // each (one, zero) pair differs at this bit
        }
        return total;
    }
};
