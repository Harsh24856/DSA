class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nxt;
        vector<int> st;                                    // values still waiting for a bigger one
        for (int x : nums2) {
            while (!st.empty() && st.back() < x) { nxt[st.back()] = x; st.pop_back(); }
            st.push_back(x);
        }
        vector<int> out;
        for (int x : nums1) out.push_back(nxt.count(x) ? nxt[x] : -1);
        return out;
    }
};
