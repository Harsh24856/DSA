class Solution {
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> out;
        vector<int> path;
        function<void(size_t, int)> go = [&](size_t start, int left) {
            if (left == 0) { out.push_back(path); return; }
            for (size_t i = start; i < candidates.size(); i++) {
                if (i > start && candidates[i] == candidates[i - 1]) continue;   // skip duplicate branch
                if (candidates[i] > left) break;                                 // sorted: the rest are bigger
                path.push_back(candidates[i]);
                go(i + 1, left - candidates[i]);                                 // i + 1: each used once
                path.pop_back();
            }
        };
        go(0, target);
        return out;
    }
};
