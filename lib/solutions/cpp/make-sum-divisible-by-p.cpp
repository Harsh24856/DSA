class Solution {
public:
    int minSubarray(vector<int>& nums, int p) {
        long long total = 0;
        for (int x : nums) total += x;
        int r = total % p;
        if (r == 0) return 0;
        int n = nums.size(), cur = 0, best = n;
        unordered_map<int, int> last{{0, -1}};   // prefix remainder -> latest index
        for (int i = 0; i < n; i++) {
            cur = (cur + nums[i]) % p;
            if (auto it = last.find(((cur - r) % p + p) % p); it != last.end())
                best = min(best, i - it->second);
            last[cur] = i;
        }
        return best < n ? best : -1;
    }
};
