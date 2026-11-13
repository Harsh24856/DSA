class Solution {
public:
    int monotoneIncreasingDigits(int n) {
        string d = to_string(n);
        int mark = d.size();
        for (int i = (int)d.size() - 1; i > 0; i--)
            if (d[i - 1] > d[i]) { d[i - 1]--; mark = i; }
        for (int i = mark; i < (int)d.size(); i++) d[i] = '9';
        return stoi(d);
    }
};
