class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        priority_queue<tuple<int, int, int>> h;            // max-heap on distance keeps the k closest
        for (auto& p : points) {
            h.push({p[0] * p[0] + p[1] * p[1], p[0], p[1]});
            if ((int)h.size() > k) h.pop();                // drop the farthest
        }
        vector<vector<int>> out;
        for (; !h.empty(); h.pop()) out.push_back({get<1>(h.top()), get<2>(h.top())});
        return out;
    }
};
// @test
    vector<vector<int>> p1{{1, 3}, {-2, 2}};
    H::check(H::sorted(Solution().kClosest(p1, 1)), vector<vector<int>>{{-2, 2}}, "kClosest a");
    vector<vector<int>> p2{{3, 3}, {5, -1}, {-2, 4}};
    H::check(H::sorted(Solution().kClosest(p2, 2)), vector<vector<int>>{{-2, 4}, {3, 3}}, "kClosest b");
