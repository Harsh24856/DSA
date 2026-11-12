class Solution {
public:
    vector<int> lexicalOrder(int n) {
        vector<int> out;
        int x = 1;
        for (int k = 0; k < n; k++) {
            out.push_back(x);
            if ((long long)x * 10 <= n) {
                x *= 10;   // go one digit deeper
            } else {
                while (x % 10 == 9 || x + 1 > n) x /= 10;   // climb back up
                x++;
            }
        }
        return out;
    }
};
