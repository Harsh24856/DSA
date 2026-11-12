class Solution {
public:
    vector<string> findItinerary(vector<vector<string>>& tickets) {
        unordered_map<string, vector<string>> g;
        sort(tickets.rbegin(), tickets.rend());
        for (auto& t : tickets) g[t[0]].push_back(t[1]);     // reverse sorted, so back() is the smallest
        vector<string> route, st = {"JFK"};
        while (!st.empty()) {
            while (!g[st.back()].empty()) {
                string next = g[st.back()].back();
                g[st.back()].pop_back();
                st.push_back(next);
            }
            route.push_back(st.back());
            st.pop_back();
        }
        reverse(route.begin(), route.end());
        return route;
    }
};
