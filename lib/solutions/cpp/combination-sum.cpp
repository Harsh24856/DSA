class Solution {
    vector<vector<int>> out;
    vector<int> path;

    void dfs(vector<int>& candidates, int start, int remain) {
        if (remain == 0) { out.push_back(path); return; }
        for (int i = start; i < (int)candidates.size(); i++) {
            int c = candidates[i];
            if (c > remain) break;                       // sorted, so the rest are too big as well
            path.push_back(c);
            dfs(candidates, i, remain - c);              // i, not i + 1: c can be reused
            path.pop_back();
        }
    }

public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        dfs(candidates, 0, target);
        return out;
    }
};
