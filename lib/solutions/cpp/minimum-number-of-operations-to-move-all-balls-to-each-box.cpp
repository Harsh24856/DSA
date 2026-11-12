class Solution {
public:
    vector<int> minOperations(string boxes) {
        int n = boxes.size();
        vector<int> out(n, 0);
        for (int pass = 0; pass < 2; pass++) {   // left to right, then right to left
            int balls = 0, moves = 0;
            for (int k = 0; k < n; k++) {
                int i = pass == 0 ? k : n - 1 - k;
                out[i] += moves;
                balls += boxes[i] == '1';
                moves += balls;                  // every ball so far moves one more step
            }
        }
        return out;
    }
};
