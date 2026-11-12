class Solution {
public:
    int maxProfitAssignment(vector<int>& difficulty, vector<int>& profit, vector<int>& worker) {
        vector<pair<int, int>> jobs;
        for (size_t i = 0; i < difficulty.size(); i++) jobs.push_back({difficulty[i], profit[i]});
        sort(jobs.begin(), jobs.end());
        sort(worker.begin(), worker.end());
        int best = 0, total = 0;
        size_t i = 0;
        for (int w : worker) {
            while (i < jobs.size() && jobs[i].first <= w) best = max(best, jobs[i++].second);   // best job so far
            total += best;
        }
        return total;
    }
};
