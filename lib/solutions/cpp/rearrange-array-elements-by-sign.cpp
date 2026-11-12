class Solution {
public:
    vector<int> rearrangeArray(vector<int>& nums) {
        vector<int> out(nums.size());
        int pos = 0, neg = 1;   // positives at even slots, negatives at odd
        for (int x : nums) {
            if (x > 0) { out[pos] = x; pos += 2; }
            else { out[neg] = x; neg += 2; }
        }
        return out;
    }
};
