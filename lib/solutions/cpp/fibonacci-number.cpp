class Solution {
public:
    int fib(int n) {
        int a = 0, b = 1;                      // f(i) and f(i + 1)
        for (int i = 0; i < n; i++) {
            int next = a + b;
            a = b;
            b = next;
        }
        return a;
    }
};
