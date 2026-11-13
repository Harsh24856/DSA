class Solution {
public:
    vector<int> getOrder(vector<vector<int>>& tasks) {
        int n = tasks.size();
        vector<int> order(n);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return tasks[a][0] < tasks[b][0]; });   // by enqueue time
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> ready;   // (processing time, index)
        vector<int> out;
        long long t = 0;
        int j = 0;
        while ((int)out.size() < n) {
            if (ready.empty() && t < tasks[order[j]][0]) t = tasks[order[j]][0];   // idle: jump ahead
            while (j < n && tasks[order[j]][0] <= t) { ready.push({tasks[order[j]][1], order[j]}); j++; }
            auto [p, i] = ready.top();
            ready.pop();
            t += p;
            out.push_back(i);
        }
        return out;
    }
};
// @test
    vector<vector<int>> a = {{1, 2}, {2, 4}, {3, 2}, {4, 1}};
    H::check(Solution().getOrder(a), vector<int>{0, 2, 3, 1}, "a");
    vector<vector<int>> b = {{7, 10}, {7, 12}, {7, 5}, {7, 4}, {7, 2}};
    H::check(Solution().getOrder(b), vector<int>{4, 3, 2, 0, 1}, "b");
    vector<vector<int>> c = {{5, 2}};
    H::check(Solution().getOrder(c), vector<int>{0}, "one");
    vector<vector<int>> d = {{1, 1}, {10, 1}};
    H::check(Solution().getOrder(d), vector<int>{0, 1}, "idle gap");
