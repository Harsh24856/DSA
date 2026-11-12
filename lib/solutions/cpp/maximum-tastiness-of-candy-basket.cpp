class Solution {
public:
    int maximumTastiness(vector<int>& price, int k) {
        sort(price.begin(), price.end());
        // can we pick k candies with every gap >= gap? take greedily from the left
        auto ok = [&](int gap) {
            int cnt = 1, last = price[0];
            for (int p : price)
                if (p - last >= gap) { cnt++; last = p; }
            return cnt >= k;
        };
        int lo = 0, hi = (price.back() - price[0]) / (k - 1);
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (ok(mid)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
