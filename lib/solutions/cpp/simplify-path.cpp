class Solution {
public:
    string simplifyPath(string path) {
        vector<string> st;
        stringstream ss(path);
        string part;
        while (getline(ss, part, '/')) {
            if (part == "..") { if (!st.empty()) st.pop_back(); }   // go up, never above root
            else if (!part.empty() && part != ".") st.push_back(part);
        }
        string out;
        for (const string& p : st) out += "/" + p;
        return out.empty() ? "/" : out;
    }
};
