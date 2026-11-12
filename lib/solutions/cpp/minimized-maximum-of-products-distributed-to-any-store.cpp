class Solution {
public:
    int minimizedMaximum(int n, vector<int>& quantities) {
        int lo = 1, hi = *max_element(quantities.begin(), quantities.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long long stores = 0;
            for (int q : quantities) stores += (q + mid - 1) / mid;   // stores this product needs
            if (stores <= n) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
