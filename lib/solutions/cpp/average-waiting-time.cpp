class Solution {
public:
    double averageWaitingTime(vector<vector<int>>& customers) {
        long long t = 0, wait = 0;
        for (auto& c : customers) {
            t = max<long long>(t, c[0]) + c[1];
            wait += t - c[0];
        }
        return (double)wait / customers.size();
    }
};
