class Solution {
public:
    int numberOfBeams(vector<string>& bank) {
        int prev = 0, ans = 0;
        for (auto& row : bank) {
            int c = count(row.begin(), row.end(), '1');
            if (c) {                 // empty rows are skipped
                ans += prev * c;
                prev = c;
            }
        }
        return ans;
    }
};
