class Solution {
public:
    long long maximumHappinessSum(vector<int>& happiness, int k) {
        sort(happiness.rbegin(), happiness.rend());   // happiest first
        long long total = 0;
        for (int i = 0; i < k; i++) total += max(happiness[i] - i, 0);   // each earlier pick costs 1
        return total;
    }
};
