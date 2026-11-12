class Solution {
public:
    int videoStitching(vector<vector<int>>& clips, int time) {
        vector<int> furthest(time, 0);                     // furthest end of a clip starting at each second
        for (auto& c : clips)
            if (c[0] < time) furthest[c[0]] = max(furthest[c[0]], c[1]);
        int count = 0, end = 0, far = 0;
        for (int t = 0; t < time; t++) {
            far = max(far, furthest[t]);
            if (t == end) {                                // current clip runs out: take the best next one
                if (far <= t) return -1;
                count++;
                end = far;
            }
        }
        return count;
    }
};
