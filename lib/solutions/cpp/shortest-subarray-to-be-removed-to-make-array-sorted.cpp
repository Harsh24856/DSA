class Solution {
public:
    int findLengthOfShortestSubarray(vector<int>& arr) {
        int n = arr.size(), r = n - 1;
        while (r > 0 && arr[r - 1] <= arr[r]) r--;   // sorted suffix starts at r
        if (r == 0) return 0;
        int best = r;                                // remove arr[0..r-1]
        for (int l = 0; l < r && (l == 0 || arr[l - 1] <= arr[l]); l++) {
            while (r < n && arr[r] < arr[l]) r++;    // first suffix element that can follow arr[l]
            best = min(best, r - l - 1);
        }
        return best;
    }
};
