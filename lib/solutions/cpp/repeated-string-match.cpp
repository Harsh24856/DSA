class Solution {
public:
    int repeatedStringMatch(string a, string b) {
        int q = (b.size() + a.size() - 1) / a.size();   // fewest copies long enough to hold b
        for (int times : {q, q + 1}) {
            string rep;
            for (int i = 0; i < times; i++) rep += a;
            if (rep.find(b) != string::npos) return times;
        }
        return -1;
    }
};
