class Solution {
public:
    int rob(vector<int>& nums) {
        int prev = 0, cur = 0;                               // best up to i-2 and i-1
        for (int x : nums) {
            int nxt = max(cur, prev + x);                    // skip this house or rob it
            prev = cur;
            cur = nxt;
        }
        return cur;
    }
};
