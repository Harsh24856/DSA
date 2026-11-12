class Solution {
public:
    int subarraysDivByK(vector<int>& nums, int k) {
        unordered_map<int, int> count{{0, 1}};   // prefix remainder -> how often seen
        int s = 0, ans = 0;
        for (int x : nums) {
            s = ((s + x) % k + k) % k;   // keep the remainder non-negative
            ans += count[s]++;
        }
        return ans;
    }
};
