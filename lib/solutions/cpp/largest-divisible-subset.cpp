class Solution {
public:
    vector<int> largestDivisibleSubset(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        vector<int> size(n, 1), prev(n, -1);   // longest chain ending at i, and the link back
        for (int i = 0; i < n; i++)
            for (int j = 0; j < i; j++)
                if (nums[i] % nums[j] == 0 && size[j] + 1 > size[i]) {
                    size[i] = size[j] + 1;
                    prev[i] = j;
                }
        int i = max_element(size.begin(), size.end()) - size.begin();
        vector<int> out;
        for (; i != -1; i = prev[i]) out.push_back(nums[i]);
        reverse(out.begin(), out.end());
        return out;
    }
};
// @test
    for (auto& [a, sz] : vector<pair<vector<int>, int>>{{{1, 2, 3}, 2}, {{1, 2, 4, 8}, 4}, {{3, 4, 16, 8}, 3}, {{7}, 1}}) {
        vector<int> in = a;
        vector<int> got = Solution().largestDivisibleSubset(in);
        bool ok = (int)got.size() == sz;
        for (int x : got) ok = ok && count(a.begin(), a.end(), x);
        for (int x : got)
            for (int y : got) ok = ok && max(x, y) % min(x, y) == 0;
        H::check(ok, true, "largestDivisibleSubset " + H::str(a));
    }
