class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;                                // indices, values decreasing from front to back
        vector<int> out;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (!dq.empty() && dq.front() <= i - k) dq.pop_front();    // front fell out of the window
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();  // smaller ones can never win
            dq.push_back(i);
            if (i >= k - 1) out.push_back(nums[dq.front()]);
        }
        return out;
    }
};
