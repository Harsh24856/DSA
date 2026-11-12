class Solution {
public:
    vector<int> partitionLabels(string s) {
        int last[26] = {};
        for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;
        vector<int> out;
        int start = 0, end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            end = max(end, last[s[i] - 'a']);            // the part must reach every copy of s[i]
            if (i == end) { out.push_back(end - start + 1); start = i + 1; }
        }
        return out;
    }
};
