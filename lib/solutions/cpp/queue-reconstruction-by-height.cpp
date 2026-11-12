class Solution {
public:
    vector<vector<int>> reconstructQueue(vector<vector<int>>& people) {
        // tallest first; among equal heights, fewer people in front first
        sort(people.begin(), people.end(), [](auto& a, auto& b) { return a[0] != b[0] ? a[0] > b[0] : a[1] < b[1]; });
        vector<vector<int>> out;
        for (auto& p : people) out.insert(out.begin() + p[1], p);   // everyone already placed is at least as tall
        return out;
    }
};
