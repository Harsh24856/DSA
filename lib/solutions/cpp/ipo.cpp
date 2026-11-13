class Solution {
public:
    int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {
        int n = profits.size();
        vector<pair<int, int>> projects(n);              // (capital needed, profit)
        for (int i = 0; i < n; i++) projects[i] = {capital[i], profits[i]};
        sort(projects.begin(), projects.end());
        priority_queue<int> ready;                       // max-heap of affordable profits
        int i = 0;
        while (k--) {
            while (i < n && projects[i].first <= w) ready.push(projects[i++].second);
            if (ready.empty()) break;                    // nothing affordable: w cannot grow
            w += ready.top();
            ready.pop();
        }
        return w;
    }
};
