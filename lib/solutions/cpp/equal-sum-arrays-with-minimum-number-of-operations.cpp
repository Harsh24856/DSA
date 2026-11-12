class Solution {
public:
    int minOperations(vector<int>& nums1, vector<int>& nums2) {
        int s1 = accumulate(nums1.begin(), nums1.end(), 0), s2 = accumulate(nums2.begin(), nums2.end(), 0);
        vector<int>* a = &nums1, *b = &nums2;
        if (s1 > s2) { swap(a, b); swap(s1, s2); }   // make a the smaller sum
        int diff = s2 - s1;
        if (diff == 0) return 0;
        vector<int> gains;                           // how much one change can close the gap
        for (int x : *a) gains.push_back(6 - x);
        for (int x : *b) gains.push_back(x - 1);
        sort(gains.rbegin(), gains.rend());
        for (int ops = 0; ops < (int)gains.size(); ops++) {
            diff -= gains[ops];
            if (diff <= 0) return ops + 1;
        }
        return -1;
    }
};
