class Solution {
public:
    vector<int> corpFlightBookings(vector<vector<int>>& bookings, int n) {
        vector<int> diff(n + 1, 0);
        for (auto& b : bookings) {
            diff[b[0] - 1] += b[2];
            diff[b[1]] -= b[2];
        }
        vector<int> out(n);
        partial_sum(diff.begin(), diff.begin() + n, out.begin());   // running total
        return out;
    }
};
