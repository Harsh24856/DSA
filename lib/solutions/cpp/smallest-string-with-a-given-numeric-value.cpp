class Solution {
public:
    string getSmallestString(int n, int k) {
        string out(n, 'a');
        for (int i = n; i >= 1; i--) {
            int v = min(26, k - (i - 1));                  // leave at least an 'a' for each earlier spot
            out[i - 1] = 'a' + v - 1;
            k -= v;
        }
        return out;
    }
};
