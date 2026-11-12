class Solution {
public:
    vector<string> reorderLogFiles(vector<string>& logs) {
        auto key = [](const string& log) {
            size_t sp = log.find(' ');
            string ident = log.substr(0, sp), rest = log.substr(sp + 1);
            // letter logs first, by content then identifier; digit logs keep their order
            return isalpha(rest[0]) ? make_tuple(0, rest, ident) : make_tuple(1, string(), string());
        };
        vector<string> out = logs;
        stable_sort(out.begin(), out.end(), [&](const string& a, const string& b) { return key(a) < key(b); });
        return out;
    }
};
