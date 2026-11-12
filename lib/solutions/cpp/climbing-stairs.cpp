class Solution {
public:
    int climbStairs(int n) {
        int a = 1, b = 1;                                    // ways to reach the last two steps
        for (int i = 0; i < n - 1; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};
