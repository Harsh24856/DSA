class Solution {
public:
    string rankTeams(vector<string>& votes) {
        int n = votes[0].size();
        vector<vector<int>> count(26, vector<int>(n, 0));  // count[team][position]
        for (auto& v : votes)
            for (int i = 0; i < n; i++) count[v[i] - 'A'][i]++;
        string teams = votes[0];
        sort(teams.begin(), teams.end(), [&](char a, char b) {
            if (count[a - 'A'] != count[b - 'A']) return count[a - 'A'] > count[b - 'A'];   // more top places first
            return a < b;
        });
        return teams;
    }
};
