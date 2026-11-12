class Solution {
public:
    bool increasingTriplet(vector<int>& nums) {
        long long first = LLONG_MAX, second = LLONG_MAX;   // smallest end of length-1 and length-2 runs
        for (int x : nums) {
            if (x <= first) first = x;
            else if (x <= second) second = x;
            else return true;
        }
        return false;
    }
};
