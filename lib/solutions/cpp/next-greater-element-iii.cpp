class Solution {
public:
    int nextGreaterElement(int n) {
        string d = to_string(n);
        int i = d.size() - 2;
        while (i >= 0 && d[i] >= d[i + 1]) i--;   // first digit from the right that can grow
        if (i < 0) return -1;
        int j = d.size() - 1;
        while (d[j] <= d[i]) j--;                 // smallest digit to its right that is bigger
        swap(d[i], d[j]);
        reverse(d.begin() + i + 1, d.end());      // smallest tail
        long long v = stoll(d);
        return v <= INT_MAX ? v : -1;
    }
};
