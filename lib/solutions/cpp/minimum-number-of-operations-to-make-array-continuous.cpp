class Solution {
public:
    int minOperations(vector<int>& nums) {
        int n = nums.size();
        vector<int> a = nums;
        sort(a.begin(), a.end());
        a.erase(unique(a.begin(), a.end()), a.end());   // distinct values, sorted
        int best = 0, j = 0;
        for (int i = 0; i < (int)a.size(); i++) {
            while (j < (int)a.size() && a[j] < (long long)a[i] + n) j++;   // values that fit in [a[i], a[i] + n)
            best = max(best, j - i);
        }
        return n - best;
    }
};
