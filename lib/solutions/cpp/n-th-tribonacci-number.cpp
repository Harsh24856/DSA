class Solution {
public:
    int tribonacci(int n) {
        long long a = 0, b = 1, c = 1;             // c runs two terms ahead, so it can pass int
        for (int i = 0; i < n; i++) {
            long long next = a + b + c;
            a = b; b = c; c = next;
        }
        return a;
    }
};
