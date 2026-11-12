class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0 || (x % 10 == 0 && x != 0)) return false;
        int rev = 0;
        while (x > rev) {                                    // reverse only the back half
            rev = rev * 10 + x % 10;
            x /= 10;
        }
        return x == rev || x == rev / 10;                    // odd length: drop the middle digit
    }
};
