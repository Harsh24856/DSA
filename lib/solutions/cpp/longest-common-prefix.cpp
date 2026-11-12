class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        size_t shortest = strs[0].size();
        for (auto& s : strs) shortest = min(shortest, s.size());
        for (size_t i = 0; i < shortest; i++)            // compare column by column
            for (auto& s : strs)
                if (s[i] != strs[0][i]) return strs[0].substr(0, i);
        return strs[0].substr(0, shortest);
    }
};
