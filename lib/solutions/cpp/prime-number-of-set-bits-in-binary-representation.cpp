class Solution {
public:
    int countPrimeSetBits(int left, int right) {
        unordered_set<int> primes{2, 3, 5, 7, 11, 13, 17, 19};   // at most 20 bits below 10^6
        int count = 0;
        for (int x = left; x <= right; x++) count += primes.count(__builtin_popcount(x));
        return count;
    }
};
