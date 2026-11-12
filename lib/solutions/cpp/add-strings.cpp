class Solution {
public:
    string addStrings(string num1, string num2) {
        int i = (int)num1.size() - 1, j = (int)num2.size() - 1, carry = 0;
        string out;
        while (i >= 0 || j >= 0 || carry) {
            int s = carry;
            if (i >= 0) s += num1[i--] - '0';
            if (j >= 0) s += num2[j--] - '0';
            out.push_back('0' + s % 10);
            carry = s / 10;
        }
        reverse(out.begin(), out.end());
        return out;
    }
};
