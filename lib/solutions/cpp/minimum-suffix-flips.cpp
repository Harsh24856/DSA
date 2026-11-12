class Solution {
public:
    int minFlips(string target) {
        int flips = 0;
        char cur = '0';
        for (char c : target)
            if (c != cur) { flips++; cur = c; }   // each change of bit needs one flip
        return flips;
    }
};
