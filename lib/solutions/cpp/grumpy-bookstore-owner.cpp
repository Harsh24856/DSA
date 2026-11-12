class Solution {
public:
    int maxSatisfied(vector<int>& customers, vector<int>& grumpy, int minutes) {
        int n = customers.size(), base = 0, gain = 0, best = 0;
        for (int i = 0; i < n; i++) if (!grumpy[i]) base += customers[i];   // happy anyway
        for (int i = 0; i < n; i++) {
            gain += customers[i] * grumpy[i];                               // window of saved customers
            if (i >= minutes) gain -= customers[i - minutes] * grumpy[i - minutes];
            best = max(best, gain);
        }
        return base + best;
    }
};
