class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % 2) return false;
        int half = total / 2;
        vector<bool> can(half + 1, false);                   // can[s]: some subset sums to s
        can[0] = true;
        for (int x : nums)
            for (int s = half; s >= x; s--)                  // backwards so x is used once
                can[s] = can[s] || can[s - x];
        return can[half];
    }
};
