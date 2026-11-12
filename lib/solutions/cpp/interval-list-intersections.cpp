class Solution {
public:
    vector<vector<int>> intervalIntersection(vector<vector<int>>& firstList, vector<vector<int>>& secondList) {
        auto &A = firstList, &B = secondList;
        vector<vector<int>> out;
        size_t i = 0, j = 0;
        while (i < A.size() && j < B.size()) {
            int lo = max(A[i][0], B[j][0]), hi = min(A[i][1], B[j][1]);
            if (lo <= hi) out.push_back({lo, hi});
            if (A[i][1] < B[j][1]) i++;   // the one that ends first is done
            else j++;
        }
        return out;
    }
};
