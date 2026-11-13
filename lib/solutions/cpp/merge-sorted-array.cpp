class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        int i = m - 1, j = n - 1, w = m + n - 1;
        while (j >= 0) {                                  // fill from the back, the free end of nums1
            if (i >= 0 && nums1[i] > nums2[j]) nums1[w--] = nums1[i--];
            else nums1[w--] = nums2[j--];
        }
    }
};
// @test
    vector<int> a{1, 2, 3, 0, 0, 0}, b{2, 5, 6}; Solution().merge(a, 3, b, 3);
    H::check(a, vector<int>{1, 2, 2, 3, 5, 6}, "merge example 1");
    vector<int> c{1}, d{}; Solution().merge(c, 1, d, 0);
    H::check(c, vector<int>{1}, "merge example 2");
    vector<int> e{0}, f{1}; Solution().merge(e, 0, f, 1);
    H::check(e, vector<int>{1}, "merge example 3");
    vector<int> g{4, 5, 6, 0, 0, 0}, k{1, 2, 3}; Solution().merge(g, 3, k, 3);
    H::check(g, vector<int>{1, 2, 3, 4, 5, 6}, "merge nums2 first");
