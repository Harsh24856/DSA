class Solution {
public:
    long long putMarbles(vector<int>& weights, int k) {
        vector<long long> pairs;       // cost of cutting between i and i + 1
        for (size_t i = 0; i + 1 < weights.size(); i++) pairs.push_back((long long)weights[i] + weights[i + 1]);
        sort(pairs.begin(), pairs.end());
        long long ans = 0;
        int m = pairs.size();
        for (int i = 0; i < k - 1; i++) ans += pairs[m - 1 - i] - pairs[i];   // k - 1 biggest minus k - 1 smallest
        return ans;
    }
};
