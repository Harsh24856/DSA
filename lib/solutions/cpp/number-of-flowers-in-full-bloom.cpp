class Solution {
public:
    vector<int> fullBloomFlowers(vector<vector<int>>& flowers, vector<int>& people) {
        vector<int> starts, ends;
        for (auto& f : flowers) { starts.push_back(f[0]); ends.push_back(f[1]); }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        vector<int> out;
        for (int t : people)   // started by t, minus ended before t
            out.push_back((upper_bound(starts.begin(), starts.end(), t) - starts.begin()) - (lower_bound(ends.begin(), ends.end(), t) - ends.begin()));
        return out;
    }
};
