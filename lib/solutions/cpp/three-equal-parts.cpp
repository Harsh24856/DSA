class Solution {
public:
    vector<int> threeEqualParts(vector<int>& arr) {
        int n = arr.size();
        vector<int> ones;
        for (int i = 0; i < n; i++)
            if (arr[i]) ones.push_back(i);
        if (ones.empty()) return {0, n - 1};
        if (ones.size() % 3) return {-1, -1};
        int k = ones.size() / 3;
        int a = ones[0], b = ones[k], c = ones[2 * k];   // first 1 of each part
        int tail = n - c;                                // the last part fixes the length
        if (equal(arr.begin() + a, arr.begin() + a + tail, arr.begin() + c) &&
            equal(arr.begin() + b, arr.begin() + b + tail, arr.begin() + c))
            return {a + tail - 1, b + tail};
        return {-1, -1};
    }
};
