class Solution {
public:
    int maximumUnits(vector<vector<int>>& boxTypes, int truckSize) {
        sort(boxTypes.begin(), boxTypes.end(), [](auto& a, auto& b) { return a[1] > b[1]; });   // most units first
        int total = 0;
        for (auto& b : boxTypes) {
            int take = min(b[0], truckSize);
            total += take * b[1];
            truckSize -= take;
            if (!truckSize) break;
        }
        return total;
    }
};
