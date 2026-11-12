class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) {   // strip bits until only the common prefix is left
            left >>= 1;
            right >>= 1;
            shift++;
        }
        return left << shift;
    }
};
