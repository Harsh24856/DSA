class Solution {
public:
    int maxChunksToSorted(vector<int>& arr) {
        int mx = 0, ans = 0;
        for (int i = 0; i < (int)arr.size(); i++) {
            mx = max(mx, arr[i]);
            if (mx == i) ans++;   // everything so far fits in 0..i
        }
        return ans;
    }
};
