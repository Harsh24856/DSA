class Solution {
public:
    vector<int> sortByBits(vector<int>& arr) {
        vector<int> out = arr;
        sort(out.begin(), out.end(), [](int a, int b) {
            int pa = __builtin_popcount(a), pb = __builtin_popcount(b);
            return pa != pb ? pa < pb : a < b;               // by bit count, then by value
        });
        return out;
    }
};
