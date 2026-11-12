class Solution {
public:
    vector<string> findRepeatedDnaSequences(string s) {
        unordered_map<string, int> seen;
        vector<string> out;
        for (int i = 0; i + 10 <= (int)s.size(); i++) {
            string w = s.substr(i, 10);
            if (++seen[w] == 2) out.push_back(w);            // report on the second sighting only
        }
        return out;
    }
};
