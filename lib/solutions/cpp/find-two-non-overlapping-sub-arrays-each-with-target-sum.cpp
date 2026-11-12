class Solution {
public:
    int minSumOfLengths(vector<int>& arr, int target) {
        const int INF = INT_MAX / 2;
        int n = arr.size();
        vector<int> best(n, INF);        // best[r] = shortest window ending at or before r
        int ans = INF, shortest = INF, l = 0, s = 0;
        for (int r = 0; r < n; r++) {
            s += arr[r];
            while (s > target) s -= arr[l++];
            if (s == target) {
                if (l > 0 && best[l - 1] < INF) ans = min(ans, best[l - 1] + r - l + 1);
                shortest = min(shortest, r - l + 1);
            }
            best[r] = shortest;
        }
        return ans == INF ? -1 : ans;
    }
};
