class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int cand = 0, count = 0;
        for (int x : nums) {
            if (count == 0) cand = x;                      // Boyer-Moore vote
            count += x == cand ? 1 : -1;
        }
        return cand;
    }
};
