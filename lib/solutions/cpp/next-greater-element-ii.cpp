class Solution {
public:
    vector<int> nextGreaterElements(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, -1), st;   // st: indices still waiting for a greater value
        for (int i = 0; i < 2 * n; i++) {   // two passes simulate the wrap-around
            int x = nums[i % n];
            while (!st.empty() && nums[st.back()] < x) {
                res[st.back()] = x;
                st.pop_back();
            }
            if (i < n) st.push_back(i);
        }
        return res;
    }
};
