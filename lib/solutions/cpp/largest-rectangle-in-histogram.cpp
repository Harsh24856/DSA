class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        vector<int> stack;                               // indexes with increasing heights
        int best = 0, n = heights.size();
        for (int i = 0; i <= n; i++) {
            int h = i < n ? heights[i] : 0;              // a 0 at the end flushes the stack
            while (!stack.empty() && heights[stack.back()] > h) {
                int top = stack.back(); stack.pop_back();
                int left = stack.empty() ? 0 : stack.back() + 1;
                best = max(best, heights[top] * (i - left));   // widest bar of height heights[top]
            }
            stack.push_back(i);
        }
        return best;
    }
};
