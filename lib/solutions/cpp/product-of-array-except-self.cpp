class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n, 1);
        int left = 1;
        for (int i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }        // product of everything to the left
        int right = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }   // times everything to the right
        return out;
    }
};
