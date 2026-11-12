class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> seen{{0, 1}};                // prefix sum -> how many times seen
        int run = 0, count = 0;
        for (int x : nums) {
            run += x;
            auto it = seen.find(run - k);                    // earlier prefixes that leave sum k
            if (it != seen.end()) count += it->second;
            seen[run]++;
        }
        return count;
    }
};
