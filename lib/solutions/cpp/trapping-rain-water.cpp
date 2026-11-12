class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = (int)height.size() - 1, lmax = 0, rmax = 0, water = 0;
        while (l < r) {
            if (height[l] < height[r]) {                     // the left wall is the limit
                lmax = max(lmax, height[l]);
                water += lmax - height[l++];
            } else {
                rmax = max(rmax, height[r]);
                water += rmax - height[r--];
            }
        }
        return water;
    }
};
