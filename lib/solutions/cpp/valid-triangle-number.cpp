class Solution {
public:
    int triangleNumber(vector<int>& a) {
        sort(a.begin(), a.end());
        int ans = 0;
        for (int k = a.size() - 1; k > 1; k--) {   // a[k] is the longest side
            int L = 0, R = k - 1;
            while (L < R) {
                if (a[L] + a[R] > a[k]) {
                    ans += R - L;   // every L..R-1 also works with R
                    R--;
                } else L++;
            }
        }
        return ans;
    }
};
