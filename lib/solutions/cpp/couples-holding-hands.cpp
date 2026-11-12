class Solution {
public:
    int minSwapsCouples(vector<int>& row) {
        vector<int> pos(row.size());
        for (int i = 0; i < (int)row.size(); i++) pos[row[i]] = i;
        int swaps = 0;
        for (int i = 0; i < (int)row.size(); i += 2) {
            int partner = row[i] ^ 1;   // couples are (0,1), (2,3), ...
            if (row[i + 1] != partner) {
                int j = pos[partner];   // bring the partner next to row[i]
                swap(row[i + 1], row[j]);
                pos[row[j]] = j;
                pos[partner] = i + 1;
                swaps++;
            }
        }
        return swaps;
    }
};
