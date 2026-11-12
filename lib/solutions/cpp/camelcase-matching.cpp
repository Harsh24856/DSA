class Solution {
public:
    vector<bool> camelMatch(vector<string>& queries, string pattern) {
        vector<bool> out;
        for (auto& q : queries) {
            size_t j = 0;
            bool ok = true;
            for (char ch : q) {
                if (j < pattern.size() && ch == pattern[j]) j++;
                else if (isupper(ch)) { ok = false; break; }   // an extra capital cannot be inserted
            }
            out.push_back(ok && j == pattern.size());
        }
        return out;
    }
};
