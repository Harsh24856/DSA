class Solution {
public:
    vector<vector<int>> kSmallestPairs(vector<int>& nums1, vector<int>& nums2, int k) {
        priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> h;   // (sum, i, j)
        for (int i = 0; i < min(k, (int)nums1.size()); i++) h.push({nums1[i] + nums2[0], i, 0});
        vector<vector<int>> out;
        while (!h.empty() && (int)out.size() < k) {
            auto [s, i, j] = h.top(); h.pop();
            out.push_back({nums1[i], nums2[j]});
            if (j + 1 < (int)nums2.size()) h.push({nums1[i] + nums2[j + 1], i, j + 1});   // next pair in row i
        }
        return out;
    }
};
