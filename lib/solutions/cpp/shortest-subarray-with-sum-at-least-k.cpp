class Solution {
public:
    int shortestSubarray(vector<int>& nums, int k) {
        int n = nums.size();
        vector<long long> pre(n + 1, 0);
        for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
        int best = n + 1;
        deque<int> dq;                                  // indexes with increasing prefix sums
        for (int j = 0; j <= n; j++) {
            while (!dq.empty() && pre[j] - pre[dq.front()] >= k) {
                best = min(best, j - dq.front());
                dq.pop_front();
            }
            while (!dq.empty() && pre[dq.back()] >= pre[j]) dq.pop_back();   // never a better start
            dq.push_back(j);
        }
        return best <= n ? best : -1;
    }
};
