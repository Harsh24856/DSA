class Solution {
public:
    bool checkSubarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> first{{0, -1}};            // first index of each remainder
        int run = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            run = (run + nums[i]) % k;
            auto it = first.find(run);
            if (it != first.end()) {
                if (i - it->second >= 2) return true;
            } else first[run] = i;
        }
        return false;
    }
};
