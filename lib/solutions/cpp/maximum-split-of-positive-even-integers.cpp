class Solution {
public:
    vector<long long> maximumEvenSplit(long long finalSum) {
        if (finalSum % 2) return {};
        vector<long long> out;
        for (long long x = 2; finalSum >= x; x += 2) {   // take 2, 4, 6, ... while they fit
            out.push_back(x);
            finalSum -= x;
        }
        out.back() += finalSum;   // the rest goes on the biggest, keeping all distinct
        return out;
    }
};
// @test
    for (auto [n, size] : vector<pair<long long, size_t>>{{12, 3}, {7, 0}, {28, 4}, {2, 1}}) {
        auto out = Solution().maximumEvenSplit(n);
        long long sum = 0;
        bool even = true;
        for (long long x : out) { sum += x; even &= x > 0 && x % 2 == 0; }
        string name = "maximumEvenSplit " + to_string(n);
        H::check(sum, n % 2 ? 0LL : n, name + " sum");
        H::check(out.size(), size, name + " size");
        H::check(even, true, name + " positive even");
        H::check(set<long long>(out.begin(), out.end()).size(), out.size(), name + " distinct");
    }
