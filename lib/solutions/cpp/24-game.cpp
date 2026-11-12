class Solution {
    bool solve(vector<double> nums) {
        if (nums.size() == 1) return fabs(nums[0] - 24) < 1e-6;
        int n = nums.size();
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) {
                if (i == j) continue;
                vector<double> rest;          // every other number
                for (int k = 0; k < n; k++)
                    if (k != i && k != j) rest.push_back(nums[k]);
                double a = nums[i], b = nums[j];
                vector<double> options{a + b, a - b, a * b};
                if (fabs(b) > 1e-6) options.push_back(a / b);
                for (double x : options) {    // replace the pair by one result
                    rest.push_back(x);
                    if (solve(rest)) return true;
                    rest.pop_back();
                }
            }
        return false;
    }
public:
    bool judgePoint24(vector<int>& cards) { return solve(vector<double>(cards.begin(), cards.end())); }
};
