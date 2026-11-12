class Solution {
public:
    long long continuousSubarrays(vector<int>& nums) {
        deque<int> mx, mn;   // indices, values decreasing / increasing
        int L = 0;
        long long ans = 0;
        for (int R = 0; R < (int)nums.size(); R++) {
            int x = nums[R];
            while (!mx.empty() && nums[mx.back()] <= x) mx.pop_back();
            while (!mn.empty() && nums[mn.back()] >= x) mn.pop_back();
            mx.push_back(R); mn.push_back(R);
            while (nums[mx.front()] - nums[mn.front()] > 2) {   // shrink until max - min <= 2
                L++;
                if (mx.front() < L) mx.pop_front();
                if (mn.front() < L) mn.pop_front();
            }
            ans += R - L + 1;   // every subarray ending at R that starts in [L, R]
        }
        return ans;
    }
};
