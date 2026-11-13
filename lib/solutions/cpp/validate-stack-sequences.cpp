class Solution {
public:
    bool validateStackSequences(vector<int>& pushed, vector<int>& popped) {
        vector<int> st;
        int j = 0;
        for (int x : pushed) {
            st.push_back(x);
            while (!st.empty() && st.back() == popped[j]) {   // pop as soon as the top is next
                st.pop_back();
                j++;
            }
        }
        return st.empty();
    }
};
