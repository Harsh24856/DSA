class Solution {
public:
    int findGCD(vector<int>& nums) {
        int a = *max_element(nums.begin(), nums.end()), b = *min_element(nums.begin(), nums.end());
        while (b) {                                          // Euclid
            int r = a % b;
            a = b;
            b = r;
        }
        return a;
    }
};
