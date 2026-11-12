class Solution {
public:
    int nthMagicalNumber(int n, int a, int b) {
        long long lcm = (long long)a / gcd(a, b) * b;
        long long lo = 1, hi = (long long)n * min(a, b);
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;
            if (mid / a + mid / b - mid / lcm >= n) hi = mid;   // magical numbers <= mid
            else lo = mid + 1;
        }
        return lo % 1000000007;
    }
};
