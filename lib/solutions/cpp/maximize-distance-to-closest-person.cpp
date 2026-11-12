class Solution {
public:
    int maxDistToClosest(vector<int>& seats) {
        int prev = -1, best = 0;
        for (int i = 0; i < (int)seats.size(); i++)
            if (seats[i]) {
                best = prev < 0 ? i : max(best, (i - prev) / 2);   // leading gap, or middle of a gap
                prev = i;
            }
        return max(best, (int)seats.size() - 1 - prev);   // trailing gap
    }
};
