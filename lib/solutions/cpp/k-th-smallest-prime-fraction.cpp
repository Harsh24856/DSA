class Solution {
public:
    vector<int> kthSmallestPrimeFraction(vector<int>& arr, int k) {
        // (value, numerator index, denominator index); one row per denominator
        priority_queue<tuple<double, int, int>, vector<tuple<double, int, int>>, greater<>> heap;
        for (int j = 1; j < (int)arr.size(); j++) heap.push({(double)arr[0] / arr[j], 0, j});
        for (int t = 0; t < k - 1; t++) {
            auto [v, i, j] = heap.top();
            heap.pop();
            if (i + 1 < j) heap.push({(double)arr[i + 1] / arr[j], i + 1, j});
        }
        auto [v, i, j] = heap.top();
        return {arr[i], arr[j]};
    }
};
