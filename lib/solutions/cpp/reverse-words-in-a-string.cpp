class Solution {
public:
    string reverseWords(string s) {
        istringstream in(s);
        vector<string> words;
        for (string w; in >> w; ) words.push_back(w);      // splits on any run of spaces
        string out;
        for (int i = words.size() - 1; i >= 0; i--) out += words[i] + (i ? " " : "");
        return out;
    }
};
