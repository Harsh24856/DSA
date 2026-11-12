class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {
        for (int i = digits.size() - 1; i >= 0; i--) {
            if (digits[i] < 9) { digits[i]++; return digits; }
            digits[i] = 0;                                 // 9 becomes 0 and carries
        }
        digits.insert(digits.begin(), 1);
        return digits;
    }
};
