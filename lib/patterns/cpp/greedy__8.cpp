// x before y when x + y > y + x: comparing the two orders of a neighbouring pair
string largestNumber(const vector<int>& nums) {
    vector<string> s;
    for (int x : nums) s.push_back(to_string(x));
    sort(s.begin(), s.end(), [](const string& a, const string& b) { return a + b > b + a; });   // strict: false for ties
    string out;
    for (auto& x : s) out += x;
    return out[0] == '0' ? "0" : out;
}

// Smith's rule: x before y when t_x * w_y < t_y * w_x (time / weight ascending, no division)
long long minWeightedCompletion(vector<pair<int, int>> jobs) {    // {time, weight}
    sort(jobs.begin(), jobs.end(), [](auto& x, auto& y) { return 1LL * x.first * y.second < 1LL * y.first * x.second; });
    long long t = 0, total = 0;
    for (auto [time, w] : jobs) { t += time; total += t * w; }    // this job finishes at t
    return total;
}
// @test
    H::check(largestNumber({3, 30, 34, 5, 9}), string("9534330"), "largest number");
    H::check(largestNumber({10, 2}), string("210"), "largest number 2");
    H::check(largestNumber({0, 0}), string("0"), "all zeros");
    H::check(minWeightedCompletion({{3, 1}, {1, 2}, {2, 2}}), 14LL, "weighted completion");
    H::check(minWeightedCompletion({{3, 1}, {1, 2}, {2, 2}, {4, 3}}), 39LL, "matches brute force");
