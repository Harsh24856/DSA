class Solution {
public:
    int numSteps(string s) {
        int steps = 0, carry = 0;
        for (int i = s.size() - 1; i > 0; i--) {
            int bit = (s[i] - '0') + carry;
            if (bit == 1) {        // odd: add 1 (carry on) and then halve
                steps += 2;
                carry = 1;
            } else steps += 1;     // even: just halve
        }
        return steps + carry;
    }
};
