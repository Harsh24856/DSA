class Solution {
public:
    int fourSumCount(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3, vector<int>& nums4) {
        unordered_map<int, int> ab;   // every a + b and how often
        for (int a : nums1)
            for (int b : nums2) ab[a + b]++;
        int total = 0;
        for (int c : nums3)
            for (int d : nums4) {
                auto it = ab.find(-c - d);
                if (it != ab.end()) total += it->second;
            }
        return total;
    }
};
