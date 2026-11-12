class Solution {
public:
    int maxCount(vector<int>& banned, int n, int maxSum) {
        unordered_set<int> ban(banned.begin(), banned.end());
        int count = 0;
        long long total = 0;
        for (int x = 1; x <= n; x++) {   // smallest numbers first
            if (ban.count(x)) continue;
            if (total + x > maxSum) break;
            total += x;
            count++;
        }
        return count;
    }
};
