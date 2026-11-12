class Solution {
public:
    int minTaps(int n, vector<int>& ranges) {
        vector<int> reach(n + 1, 0);                     // furthest point a tap starting at lo can water
        for (int i = 0; i <= n; i++) {
            int lo = max(0, i - ranges[i]);
            reach[lo] = max(reach[lo], i + ranges[i]);
        }
        int taps = 0, end = 0, far = 0;
        for (int i = 0; i < n; i++) {
            far = max(far, reach[i]);
            if (i == end) {
                if (far <= i) return -1;                 // a gap nothing covers
                taps++;
                end = far;
            }
        }
        return taps;
    }
};
