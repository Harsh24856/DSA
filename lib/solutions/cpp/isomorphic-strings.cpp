class Solution {
public:
    bool isIsomorphic(string s, string t) {
        int st[256], ts[256];                            // char maps both ways, -1 for unset
        fill(st, st + 256, -1);
        fill(ts, ts + 256, -1);
        for (size_t i = 0; i < s.size(); i++) {
            unsigned char a = s[i], b = t[i];
            if (st[a] == -1) st[a] = b;
            if (ts[b] == -1) ts[b] = a;
            if (st[a] != b || ts[b] != a) return false;
        }
        return true;
    }
};
