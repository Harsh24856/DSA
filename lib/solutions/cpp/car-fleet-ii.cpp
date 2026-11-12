class Solution {
public:
    vector<double> getCollisionTimes(vector<vector<int>>& cars) {
        int n = cars.size();
        vector<double> ans(n, -1.0);
        vector<int> stack;   // cars ahead that this car might hit
        for (int i = n - 1; i >= 0; i--) {
            int p = cars[i][0], s = cars[i][1];
            while (!stack.empty()) {
                int j = stack.back(), pj = cars[j][0], sj = cars[j][1];
                // too slow to catch j, or j merges into a fleet before we arrive
                if (s <= sj || (ans[j] > 0 && (double)(pj - p) / (s - sj) >= ans[j])) {
                    stack.pop_back();
                } else {
                    ans[i] = (double)(pj - p) / (s - sj);
                    break;
                }
            }
            stack.push_back(i);
        }
        return ans;
    }
};
