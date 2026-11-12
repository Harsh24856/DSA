class Solution {
public:
    bool carPooling(vector<vector<int>>& trips, int capacity) {
        vector<int> diff(1001, 0);
        for (auto& t : trips) {
            diff[t[1]] += t[0];                            // passengers get on
            diff[t[2]] -= t[0];                            // and off
        }
        int load = 0;
        for (int d : diff) {
            load += d;
            if (load > capacity) return false;
        }
        return true;
    }
};
