class Solution {
public:
    bool mergeTriplets(vector<vector<int>>& triplets, vector<int>& target) {
        bool got[3] = {false, false, false};
        for (auto& t : triplets) {
            if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;   // unsafe
            for (int i = 0; i < 3; i++) if (t[i] == target[i]) got[i] = true;
        }
        return got[0] && got[1] && got[2];
    }
};
