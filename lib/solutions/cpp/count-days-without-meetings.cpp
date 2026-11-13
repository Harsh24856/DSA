class Solution {
public:
    int countDays(int days, vector<vector<int>>& meetings) {
        sort(meetings.begin(), meetings.end());
        int busy = 0, s = -1, e = -2;                    // the open block [s, e]; empty at first
        for (auto& m : meetings) {
            if (m[0] <= e + 1) e = max(e, m[1]);         // overlaps or touches: extend
            else {
                busy += e - s + 1;                       // close the block (0 for the empty start)
                s = m[0]; e = m[1];
            }
        }
        busy += e - s + 1;
        return days - busy;
    }
};
