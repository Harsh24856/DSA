class Solution {
public:
    int deleteAndEarn(vector<int>& nums) {
        int top = *max_element(nums.begin(), nums.end());
        vector<int> points(top + 1, 0);
        for (int x : nums) points[x] += x;     // taking value v earns every copy of it
        int take = 0, skip = 0;                // house robber over the values
        for (int p : points) {
            int t = skip + p;
            skip = max(take, skip);
            take = t;
        }
        return max(take, skip);
    }
};
