class Solution {
public:
    int countPrimes(int n) {
        if (n < 3) return 0;
        vector<bool> isP(n, true);
        isP[0] = isP[1] = false;
        for (long long p = 2; p * p < n; p++)
            if (isP[p])
                for (long long m = p * p; m < n; m += p) isP[m] = false;   // smaller multiples already crossed
        return (int)count(isP.begin(), isP.end(), true);
    }
};
