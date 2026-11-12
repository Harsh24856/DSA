class Solution {
public:
    vector<int> survivedRobotsHealths(vector<int>& positions, vector<int>& healths, string directions) {
        int n = positions.size();
        vector<int> h = healths, order(n);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return positions[a] < positions[b]; });
        vector<int> st;   // robots moving right, waiting to meet one moving left
        for (int i : order) {
            if (directions[i] == 'R') { st.push_back(i); continue; }
            while (!st.empty() && h[i]) {
                int j = st.back();
                if (h[j] < h[i]) { st.pop_back(); h[j] = 0; h[i]--; }
                else if (h[j] > h[i]) { h[j]--; h[i] = 0; }
                else { st.pop_back(); h[j] = h[i] = 0; }
            }
        }
        vector<int> out;
        for (int x : h) if (x) out.push_back(x);   // survivors in input order
        return out;
    }
};
