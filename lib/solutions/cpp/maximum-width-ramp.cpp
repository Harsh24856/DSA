class Solution {
public:
    int maxWidthRamp(vector<int>& nums) {
        vector<int> st;   // indices of a strictly decreasing run of prefix minimums
        for (int i = 0; i < (int)nums.size(); i++)
            if (st.empty() || nums[st.back()] > nums[i]) st.push_back(i);
        int best = 0;
        for (int j = nums.size() - 1; j >= 0; j--)
            while (!st.empty() && nums[st.back()] <= nums[j]) {
                best = max(best, j - st.back());
                st.pop_back();
            }
        return best;
    }
};
