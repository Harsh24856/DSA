class Solution {
public:
    vector<int> countSmaller(vector<int>& nums) {
        vector<int> vals = nums;   // compress values to ranks 1..m
        sort(vals.begin(), vals.end());
        vals.erase(unique(vals.begin(), vals.end()), vals.end());
        vector<int> bit(vals.size() + 1, 0);
        vector<int> out;
        for (int i = nums.size() - 1; i >= 0; i--) {
            int rank = lower_bound(vals.begin(), vals.end(), nums[i]) - vals.begin() + 1;
            int s = 0;
            for (int r = rank - 1; r > 0; r -= r & -r) s += bit[r];   // how many smaller seen so far
            out.push_back(s);
            for (int r = rank; r < (int)bit.size(); r += r & -r) bit[r]++;
        }
        reverse(out.begin(), out.end());
        return out;
    }
};
