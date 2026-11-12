class Solution {
public:
    int myAtoi(string s) {
        size_t i = 0, n = s.size();
        while (i < n && s[i] == ' ') i++;
        int sign = 1;
        if (i < n && (s[i] == '+' || s[i] == '-')) sign = s[i++] == '-' ? -1 : 1;
        long long num = 0;
        while (i < n && isdigit((unsigned char)s[i])) {
            num = min(num * 10 + (s[i++] - '0'), (long long)INT_MAX + 1);   // stop growing once past int range
        }
        return (int)max((long long)INT_MIN, min((long long)INT_MAX, sign * num));
    }
};
