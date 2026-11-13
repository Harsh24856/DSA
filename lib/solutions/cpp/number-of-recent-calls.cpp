class RecentCounter {
    queue<int> q;
public:
    RecentCounter() {}

    int ping(int t) {
        q.push(t);
        while (q.front() < t - 3000) q.pop();   // times only grow, so old ones leave from the front
        return q.size();
    }
};
// @test
    RecentCounter r;
    H::check(r.ping(1), 1, "ping 1");
    H::check(r.ping(100), 2, "ping 100");
    H::check(r.ping(3001), 3, "ping 3001");
    H::check(r.ping(3002), 3, "ping 3002");
    RecentCounter g;
    vector<int> got;
    for (int t : {642, 1849, 4921, 5936, 5957}) got.push_back(g.ping(t));
    H::check(got, vector<int>{1, 2, 1, 2, 3}, "gap");
