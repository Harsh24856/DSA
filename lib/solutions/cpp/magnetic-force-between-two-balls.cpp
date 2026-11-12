class Solution {
public:
    int maxDistance(vector<int>& position, int m) {
        sort(position.begin(), position.end());
        auto fits = [&](int d) {                 // can m balls be at least d apart?
            int count = 1, last = position[0];
            for (size_t i = 1; i < position.size(); i++)
                if (position[i] - last >= d) { count++; last = position[i]; }
            return count >= m;
        };
        int lo = 1, hi = position.back() - position[0];
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;    // round up so lo = mid moves
            if (fits(mid)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
