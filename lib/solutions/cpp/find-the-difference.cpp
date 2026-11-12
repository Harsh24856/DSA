class Solution {
public:
    char findTheDifference(string s, string t) {
        int x = 0;
        for (char ch : s + t) x ^= ch;                       // pairs cancel, the extra letter stays
        return (char)x;
    }
};
