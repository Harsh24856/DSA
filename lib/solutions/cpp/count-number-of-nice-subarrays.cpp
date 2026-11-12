class Solution {
public:
    int numberOfSubarrays(vector<int>& nums, int k) {
        unordered_map<int, int> seen{{0, 1}};   // count of odd numbers so far -> how often
        int s = 0, ans = 0;
        for (int x : nums) {
            s += x & 1;
            if (auto it = seen.find(s - k); it != seen.end()) ans += it->second;
            seen[s]++;
        }
        return ans;
    }
};
