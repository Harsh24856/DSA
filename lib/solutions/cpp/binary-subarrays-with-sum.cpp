class Solution {
public:
    int numSubarraysWithSum(vector<int>& nums, int goal) {
        unordered_map<int, int> seen{{0, 1}};   // prefix sum -> how many times seen
        int s = 0, ans = 0;
        for (int x : nums) {
            s += x;
            if (auto it = seen.find(s - goal); it != seen.end()) ans += it->second;
            seen[s]++;
        }
        return ans;
    }
};
