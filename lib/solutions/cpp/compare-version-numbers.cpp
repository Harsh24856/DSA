class Solution {
    vector<int> parts(const string& v) {
        vector<int> out;
        stringstream ss(v);
        string p;
        while (getline(ss, p, '.')) out.push_back(stoi(p));   // stoi drops leading zeros
        return out;
    }

public:
    int compareVersion(string version1, string version2) {
        auto a = parts(version1), b = parts(version2);
        for (size_t i = 0; i < max(a.size(), b.size()); i++) {
            int x = i < a.size() ? a[i] : 0, y = i < b.size() ? b[i] : 0;   // a missing part counts as 0
            if (x != y) return x > y ? 1 : -1;
        }
        return 0;
    }
};
