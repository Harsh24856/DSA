class Solution {
public:
    vector<int> sortArray(vector<int>& nums) {
        if (nums.size() <= 1) return nums;
        size_t mid = nums.size() / 2;
        vector<int> left(nums.begin(), nums.begin() + mid), right(nums.begin() + mid, nums.end());
        vector<int> a = sortArray(left), b = sortArray(right);
        vector<int> out;
        size_t i = 0, j = 0;
        while (i < a.size() && j < b.size()) {
            if (a[i] <= b[j]) out.push_back(a[i++]);    // <= keeps the sort stable
            else out.push_back(b[j++]);
        }
        out.insert(out.end(), a.begin() + i, a.end());
        out.insert(out.end(), b.begin() + j, b.end());
        return out;
    }
};
