class Solution {
public:
    bool canMakeSubsequence(string str1, string str2) {
        size_t j = 0;
        for (char c : str1) {
            char next = (c - 'a' + 1) % 26 + 'a';   // c after one cyclic increment
            if (j < str2.size() && (c == str2[j] || next == str2[j])) j++;
        }
        return j == str2.size();
    }
};
