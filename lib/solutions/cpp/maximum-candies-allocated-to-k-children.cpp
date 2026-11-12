class Solution {
public:
    int maximumCandies(vector<int>& candies, long long k) {
        int lo = 0, hi = *max_element(candies.begin(), candies.end());
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            long long piles = 0;
            for (int c : candies) piles += c / mid;   // piles of size mid we can make
            if (piles >= k) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
