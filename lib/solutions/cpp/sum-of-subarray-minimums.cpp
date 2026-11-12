class Solution {
public:
    int sumSubarrayMins(vector<int>& arr) {
        const long long MOD = 1e9 + 7;
        int n = arr.size();
        vector<int> st;                                   // indexes with rising values
        long long total = 0;
        for (int i = 0; i <= n; i++) {
            int x = i < n ? arr[i] : 0;                   // a final 0 flushes the stack
            while (!st.empty() && arr[st.back()] >= x) {
                int j = st.back(); st.pop_back();
                int left = st.empty() ? -1 : st.back();
                // arr[j] is the minimum of (j - left) * (i - j) subarrays
                total = (total + (long long)arr[j] * (j - left) % MOD * (i - j)) % MOD;
            }
            st.push_back(i);
        }
        return total;
    }
};
