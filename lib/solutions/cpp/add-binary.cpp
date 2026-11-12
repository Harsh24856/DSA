class Solution {
public:
    string addBinary(string a, string b) {
        int i = (int)a.size() - 1, j = (int)b.size() - 1, carry = 0;
        string out;
        while (i >= 0 || j >= 0 || carry) {
            int s = carry;
            if (i >= 0) s += a[i--] - '0';
            if (j >= 0) s += b[j--] - '0';
            out.push_back('0' + s % 2);
            carry = s / 2;
        }
        reverse(out.begin(), out.end());                     // digits were built from the right
        return out;
    }
};
