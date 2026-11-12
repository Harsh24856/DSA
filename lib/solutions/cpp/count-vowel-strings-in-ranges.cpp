class Solution {
public:
    vector<int> vowelStrings(vector<string>& words, vector<vector<int>>& queries) {
        auto vowel = [](char c) { return string("aeiou").find(c) != string::npos; };
        vector<int> pre{0};          // pre[i] = good words among the first i
        for (auto& w : words) pre.push_back(pre.back() + (vowel(w.front()) && vowel(w.back())));
        vector<int> out;
        for (auto& q : queries) out.push_back(pre[q[1] + 1] - pre[q[0]]);
        return out;
    }
};
