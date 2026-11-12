class Solution {
public:
    int nthUglyNumber(int n) {
        vector<long long> ugly{1};                           // long long: candidates can pass int range
        size_t i2 = 0, i3 = 0, i5 = 0;
        while ((int)ugly.size() < n) {
            long long a = ugly[i2] * 2, b = ugly[i3] * 3, c = ugly[i5] * 5;
            long long nxt = min({a, b, c});
            ugly.push_back(nxt);
            if (nxt == a) i2++;                              // advance every pointer that made it,
            if (nxt == b) i3++;                              // so duplicates like 6 appear once
            if (nxt == c) i5++;
        }
        return (int)ugly.back();
    }
};
