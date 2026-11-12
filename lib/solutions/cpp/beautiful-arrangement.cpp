class Solution {
    int n = 0;
    vector<bool> used;
    int place(int pos) {
        if (pos > n) return 1;                               // every spot filled
        int total = 0;
        for (int x = 1; x <= n; x++)
            if (!used[x] && (x % pos == 0 || pos % x == 0)) {
                used[x] = true;
                total += place(pos + 1);
                used[x] = false;                             // undo and try the next number
            }
        return total;
    }
public:
    int countArrangement(int n) {
        this->n = n;
        used.assign(n + 1, false);
        return place(1);
    }
};
