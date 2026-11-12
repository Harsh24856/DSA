class Solution {
public:
    vector<vector<int>> combinationSum3(int k, int n) {
        vector<vector<int>> out;
        vector<int> path;
        function<void(int, int)> go = [&](int start, int rem) {
            if ((int)path.size() == k) {
                if (rem == 0) out.push_back(path);
                return;
            }
            for (int d = start; d <= 9; d++) {
                if (d > rem) break;                        // digits only grow, so stop early
                path.push_back(d);
                go(d + 1, rem - d);
                path.pop_back();
            }
        };
        go(1, n);
        return out;
    }
};
