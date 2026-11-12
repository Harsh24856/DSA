class Solution {
public:
    int findMaxLength(vector<int>& nums) {
        unordered_map<int, int> first{{0, -1}};   // running score -> first index
        int s = 0, best = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            s += nums[i] ? 1 : -1;
            if (auto it = first.find(s); it != first.end()) best = max(best, i - it->second);
            else first[s] = i;
        }
        return best;
    }
};
