class Solution {
public:
    int minSideJumps(vector<int>& obstacles) {
        const int INF = INT_MAX / 2;
        array<int, 3> dp{1, 0, 1};       // fewest jumps to stand in each lane
        for (size_t i = 1; i < obstacles.size(); i++) {
            int o = obstacles[i];
            if (o) dp[o - 1] = INF;
            int best = *min_element(dp.begin(), dp.end());
            for (int lane = 0; lane < 3; lane++)
                if (lane != o - 1) dp[lane] = min(dp[lane], best + 1);   // jump over from the best lane
        }
        return *min_element(dp.begin(), dp.end());
    }
};
