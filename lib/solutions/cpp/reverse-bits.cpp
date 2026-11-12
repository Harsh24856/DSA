class Solution {
public:
    uint32_t reverseBits(uint32_t n) {
        uint32_t out = 0;
        for (int i = 0; i < 32; i++) {
            out = (out << 1) | (n & 1);                      // move n's last bit onto out's end
            n >>= 1;
        }
        return out;
    }
};
