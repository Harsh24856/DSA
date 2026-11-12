class Solution {
public:
    int maximumBags(vector<int>& capacity, vector<int>& rocks, int additionalRocks) {
        vector<int> gaps;
        for (size_t i = 0; i < capacity.size(); i++) gaps.push_back(capacity[i] - rocks[i]);
        sort(gaps.begin(), gaps.end());   // fill the nearly full bags first
        int full = 0;
        for (int gap : gaps) {
            if (gap > additionalRocks) break;
            additionalRocks -= gap;
            full++;
        }
        return full;
    }
};
