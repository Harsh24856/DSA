class Solution {
public:
    char findKthBit(int n, int k) {
        bool flip = false;
        while (n > 1) {
            int mid = 1 << (n - 1);                      // length of S(n) is 2^n - 1
            if (k == mid) return flip ? '0' : '1';
            if (k > mid) { k = 2 * mid - k; flip = !flip; }
            n--;
        }
        return flip ? '1' : '0';
    }
};
