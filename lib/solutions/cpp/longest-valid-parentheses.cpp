class Solution {
public:
    int longestValidParentheses(string s) {
        vector<int> st{-1};          // bottom: index just before the current valid run
        int best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') st.push_back(i);
            else {
                st.pop_back();
                if (st.empty()) st.push_back(i);   // unmatched ')' starts a new base
                else best = max(best, i - st.back());
            }
        }
        return best;
    }
};
