class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        vector<int> ans(temperatures.size(), 0);
        vector<int> stack;                               // days still waiting for a warmer one
        for (int i = 0; i < (int)temperatures.size(); i++) {
            while (!stack.empty() && temperatures[stack.back()] < temperatures[i]) {
                ans[stack.back()] = i - stack.back();
                stack.pop_back();
            }
            stack.push_back(i);
        }
        return ans;
    }
};
