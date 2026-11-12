class Solution {
public:
    double mincostToHireWorkers(vector<int>& quality, vector<int>& wage, int k) {
        vector<pair<double, int>> workers;               // (wage per unit of quality, quality)
        for (size_t i = 0; i < quality.size(); i++) workers.push_back({(double)wage[i] / quality[i], quality[i]});
        sort(workers.begin(), workers.end());
        priority_queue<int> heap;                        // the k smallest qualities so far
        long long total = 0;
        double best = 1e18;
        for (auto [ratio, q] : workers) {
            heap.push(q);
            total += q;
            if ((int)heap.size() > k) { total -= heap.top(); heap.pop(); }
            if ((int)heap.size() == k) best = min(best, ratio * total);   // this worker sets the pay rate
        }
        return best;
    }
};
