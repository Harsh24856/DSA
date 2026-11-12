class Solution {
public:
    int longestMountain(vector<int>& arr) {
        int best = 0, up = 0, down = 0;
        for (int i = 1; i < (int)arr.size(); i++) {
            if ((down && arr[i] > arr[i - 1]) || arr[i] == arr[i - 1]) up = down = 0;   // a new mountain starts
            if (arr[i] > arr[i - 1]) up++;
            else if (arr[i] < arr[i - 1]) down++;
            if (up && down) best = max(best, up + down + 1);
        }
        return best;
    }
};
