class Solution {
public:
    int numberOfWeakCharacters(vector<vector<int>>& properties) {
        // attack descending, defense ascending within one attack
        sort(properties.begin(), properties.end(), [](auto& a, auto& b) {
            return a[0] != b[0] ? a[0] > b[0] : a[1] < b[1];
        });
        int best = 0, weak = 0;
        for (auto& p : properties) {
            if (p[1] < best) weak++;
            best = max(best, p[1]);
        }
        return weak;
    }
};
