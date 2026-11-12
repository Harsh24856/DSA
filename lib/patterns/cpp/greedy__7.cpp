// sort by a - b: the people who save most by flying to A go to A
int twoCity(vector<vector<int>> costs) {
    sort(costs.begin(), costs.end(), [](auto& x, auto& y) { return x[0] - x[1] < y[0] - y[1]; });
    int n = costs.size() / 2, total = 0;
    for (int i = 0; i < (int)costs.size(); i++) total += i < n ? costs[i][0] : costs[i][1];
    return total;
}
// @test
    H::check(twoCity({{10, 20}, {30, 200}, {400, 50}, {30, 20}}), 110, "two city");
    H::check(twoCity({{259, 770}, {448, 54}, {926, 667}, {184, 139}, {840, 118}, {577, 469}}), 1859, "two city 2");
