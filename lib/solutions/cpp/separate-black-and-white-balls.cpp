class Solution {
public:
    long long minimumSteps(string s) {
        long long ones = 0, steps = 0;
        for (char ch : s) {
            if (ch == '1') ones++;
            else steps += ones;                            // this 0 passes every 1 to its left
        }
        return steps;
    }
};
