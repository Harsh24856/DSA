class Solution {
public:
    int findNumberOfLIS(vector<int>& nums) {
        int n = nums.size();
        vector<int> length(n, 1), count(n, 1);               // longest run ending at i, and how many
        for (int i = 0; i < n; i++)
            for (int j = 0; j < i; j++)
                if (nums[j] < nums[i]) {
                    if (length[j] + 1 > length[i]) { length[i] = length[j] + 1; count[i] = count[j]; }
                    else if (length[j] + 1 == length[i]) count[i] += count[j];
                }
        int best = *max_element(length.begin(), length.end()), total = 0;
        for (int i = 0; i < n; i++) if (length[i] == best) total += count[i];
        return total;
    }
};
