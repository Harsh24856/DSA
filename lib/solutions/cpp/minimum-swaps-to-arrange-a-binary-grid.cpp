class Solution {
public:
    int minSwaps(vector<vector<int>>& grid) {
        int n = grid.size();
        vector<int> tz;                          // trailing zeros of each row
        for (auto& row : grid) {
            int z = 0;
            while (z < n && row[n - 1 - z] == 0) z++;
            tz.push_back(z);
        }
        int swaps = 0;
        for (int i = 0; i < n; i++) {
            int need = n - 1 - i, j = i;
            while (j < n && tz[j] < need) j++;   // nearest row below that fits
            if (j == n) return -1;
            int v = tz[j];
            tz.erase(tz.begin() + j);            // bubble it up to row i
            tz.insert(tz.begin() + i, v);
            swaps += j - i;
        }
        return swaps;
    }
};
