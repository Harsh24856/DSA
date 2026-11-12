class Solution {
public:
    int findMaximumXOR(vector<int>& nums) {
        int mx = *max_element(nums.begin(), nums.end()), bits = 0;
        while (mx >> bits) bits++;   // bit length of the largest number
        int ans = 0;
        for (int b = bits - 1; b >= 0; b--) {
            ans <<= 1;
            unordered_set<int> prefixes;
            for (int x : nums) prefixes.insert(x >> b);
            int cand = ans | 1;   // try to set this bit
            for (int p : prefixes)
                if (prefixes.count(cand ^ p)) { ans = cand; break; }
        }
        return ans;
    }
};
