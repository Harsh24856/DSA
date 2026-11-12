class Solution {
public:
    vector<int> sumEvenAfterQueries(vector<int>& nums, vector<vector<int>>& queries) {
        int even = 0;
        for (int x : nums) if (x % 2 == 0) even += x;
        vector<int> out;
        for (auto& q : queries) {
            int val = q[0], i = q[1];
            if (nums[i] % 2 == 0) even -= nums[i];         // remove the old value
            nums[i] += val;
            if (nums[i] % 2 == 0) even += nums[i];         // add the new one
            out.push_back(even);
        }
        return out;
    }
};
