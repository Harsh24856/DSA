class Solution {
public:
    int findComplement(int num) {
        unsigned mask = 1;
        while (mask <= (unsigned)num) mask <<= 1;  // first power of two above num
        return num ^ (int)(mask - 1);              // flip only the significant bits
    }
};
