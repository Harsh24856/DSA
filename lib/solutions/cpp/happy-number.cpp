class Solution {
public:
    bool isHappy(int n) {
        unordered_set<int> seen;
        while (n != 1 && !seen.count(n)) {                   // a repeat means a cycle without 1
            seen.insert(n);
            int s = 0;
            for (; n; n /= 10) s += (n % 10) * (n % 10);
            n = s;
        }
        return n == 1;
    }
};
