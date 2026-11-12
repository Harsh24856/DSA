class Solution {
public:
    int longestSubarray(vector<int>& nums, int limit) {
        deque<int> mx, mn;   // values, decreasing / increasing
        int L = 0, best = 0;
        for (int R = 0; R < (int)nums.size(); R++) {
            int x = nums[R];
            while (!mx.empty() && mx.back() < x) mx.pop_back();
            while (!mn.empty() && mn.back() > x) mn.pop_back();
            mx.push_back(x); mn.push_back(x);
            if (mx.front() - mn.front() > limit) {   // slide the window by one
                if (mx.front() == nums[L]) mx.pop_front();
                if (mn.front() == nums[L]) mn.pop_front();
                L++;
            }
            best = max(best, R - L + 1);
        }
        return best;
    }
};
