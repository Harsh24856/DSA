class Solution {
public:
    int minJumps(vector<int>& arr) {
        int n = arr.size();
        unordered_map<int, vector<int>> same;   // value -> indices holding it
        for (int i = 0; i < n; i++) same[arr[i]].push_back(i);
        vector<int> dist(n, -1);
        dist[0] = 0;
        queue<int> q; q.push(0);
        while (!q.empty()) {
            int i = q.front(); q.pop();
            if (i == n - 1) return dist[i];
            vector<int> next;
            if (auto it = same.find(arr[i]); it != same.end()) {
                next = move(it->second);
                same.erase(it);                 // each value's group is used once
            }
            next.push_back(i - 1);
            next.push_back(i + 1);
            for (int j : next)
                if (0 <= j && j < n && dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
        }
        return -1;
    }
};
