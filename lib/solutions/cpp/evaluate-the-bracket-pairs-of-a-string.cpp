class Solution {
public:
    string evaluate(string s, vector<vector<string>>& knowledge) {
        unordered_map<string, string> k;
        for (auto& kv : knowledge) k[kv[0]] = kv[1];
        string out;
        for (size_t i = 0; i < s.size();) {
            if (s[i] == '(') {
                size_t j = s.find(')', i);
                auto it = k.find(s.substr(i + 1, j - i - 1));
                out += it == k.end() ? "?" : it->second;
                i = j + 1;
            } else out += s[i++];
        }
        return out;
    }
};
