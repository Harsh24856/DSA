class Solution {
    // remove every "ab" (a then b) with a stack, scoring pts each
    int strip(string& s, char a, char b, int pts) {
        string st;
        int got = 0;
        for (char ch : s) {
            if (!st.empty() && st.back() == a && ch == b) {
                st.pop_back();
                got += pts;
            } else st += ch;
        }
        s = st;
        return got;
    }
public:
    int maximumGain(string s, int x, int y) {
        if (x >= y) return strip(s, 'a', 'b', x) + strip(s, 'b', 'a', y);   // the dearer pair first
        return strip(s, 'b', 'a', y) + strip(s, 'a', 'b', x);
    }
};
