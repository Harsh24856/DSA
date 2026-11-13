// The interval toolkit. An interval is {start, end}: closed [s, e] unless the function says half-open [s, e).
using Iv = pair<int, int>;

bool overlaps(Iv a, Iv b) { return max(a.first, b.first) <= min(a.second, b.second); }   // touching counts

optional<Iv> intersect(Iv a, Iv b) {
    int s = max(a.first, b.first), e = min(a.second, b.second);
    if (s > e) return nullopt;
    return Iv{s, e};
}

vector<Iv> mergeAll(vector<Iv> v) {                     // O(n log n): sort by start, extend or open a block
    sort(v.begin(), v.end());
    vector<Iv> out;
    for (auto [s, e] : v) {
        if (!out.empty() && s <= out.back().second) out.back().second = max(out.back().second, e);
        else out.push_back({s, e});
    }
    return out;
}

vector<Iv> insertOne(const vector<Iv>& v, Iv add) {    // v sorted and disjoint; O(n) in three phases
    vector<Iv> out;
    size_t i = 0;
    while (i < v.size() && v[i].second < add.first) out.push_back(v[i++]);        // entirely before
    while (i < v.size() && v[i].first <= add.second) {                             // overlapping: absorb
        add = {min(add.first, v[i].first), max(add.second, v[i].second)};
        i++;
    }
    out.push_back(add);
    while (i < v.size()) out.push_back(v[i++]);                                    // entirely after
    return out;
}

int maxOverlap(const vector<Iv>& v) {                  // half-open: +1 at start, -1 at end
    vector<pair<int, int>> ev;
    for (auto [s, e] : v) { ev.push_back({s, 1}); ev.push_back({e, -1}); }
    sort(ev.begin(), ev.end());                         // at equal times -1 comes first: free before reuse
    int cur = 0, best = 0;
    for (auto [t, d] : ev) best = max(best, cur += d);
    return best;
}

int minRoomsHeap(vector<Iv> v) {                        // half-open: min-heap of end times
    sort(v.begin(), v.end());
    priority_queue<int, vector<int>, greater<int>> ends;
    for (auto [s, e] : v) {
        if (!ends.empty() && ends.top() <= s) ends.pop();   // reuse the room that frees first
        ends.push(e);
    }
    return ends.size();
}

int maxNonOverlapping(vector<Iv> v) {                   // half-open: sort by END, keep what fits
    sort(v.begin(), v.end(), [](Iv a, Iv b) { return a.second < b.second; });
    int count = 0;
    long long last = LLONG_MIN;
    for (auto [s, e] : v)
        if (s >= last) { count++; last = e; }
    return count;
}

vector<Iv> intersectLists(const vector<Iv>& A, const vector<Iv>& B) {   // both sorted and disjoint, O(n + m)
    vector<Iv> out;
    for (size_t i = 0, j = 0; i < A.size() && j < B.size(); ) {
        if (auto part = intersect(A[i], B[j])) out.push_back(*part);
        if (A[i].second < B[j].second) i++; else j++;   // the one ending first meets nothing later
    }
    return out;
}

vector<int> coverage(const vector<Iv>& v, int size) {   // closed integer points 0..size-1: difference array
    vector<int> diff(size + 1, 0);
    for (auto [s, e] : v) { diff[s]++; diff[e + 1]--; }
    partial_sum(diff.begin(), diff.end(), diff.begin());
    diff.pop_back();
    return diff;
}

int countContaining(const vector<Iv>& v, int x) {       // closed: started by x minus ended before x
    vector<int> st, en;
    for (auto [s, e] : v) { st.push_back(s); en.push_back(e); }
    sort(st.begin(), st.end());
    sort(en.begin(), en.end());
    return (upper_bound(st.begin(), st.end(), x) - st.begin()) - (lower_bound(en.begin(), en.end(), x) - en.begin());
}
// @test
    H::check(overlaps({1, 3}, {3, 5}), true, "touching overlaps");
    H::check(overlaps({1, 2}, {3, 4}), false, "apart");
    H::check(intersect({1, 5}, {3, 9}) == optional<Iv>(Iv{3, 5}), true, "intersect");
    H::check(intersect({1, 2}, {4, 5}).has_value(), false, "no intersection");
    H::check(mergeAll({{8, 10}, {1, 3}, {2, 6}, {15, 18}}), vector<Iv>{{1, 6}, {8, 10}, {15, 18}}, "merge");
    H::check(mergeAll({{1, 4}, {4, 5}}), vector<Iv>{{1, 5}}, "merge touching");
    H::check(insertOne({{1, 2}, {3, 5}, {6, 7}, {8, 10}, {12, 16}}, {4, 8}), vector<Iv>{{1, 2}, {3, 10}, {12, 16}}, "insert");
    H::check(insertOne({}, {5, 7}), vector<Iv>{{5, 7}}, "insert into empty");
    vector<Iv> meetings{{0, 30}, {5, 10}, {15, 20}, {10, 15}};
    H::check(maxOverlap(meetings), 2, "max overlap");
    H::check(minRoomsHeap(meetings), 2, "rooms by heap");
    H::check(maxOverlap({{1, 5}, {5, 9}}), 1, "end frees before start");
    H::check(maxNonOverlapping({{1, 2}, {2, 3}, {3, 4}, {1, 3}}), 3, "activity selection");
    H::check(intersectLists({{0, 2}, {5, 10}, {13, 23}, {24, 25}}, {{1, 5}, {8, 12}, {15, 24}, {25, 26}}), vector<Iv>{{1, 2}, {5, 5}, {8, 10}, {15, 23}, {24, 24}, {25, 25}}, "intersect lists");
    H::check(coverage({{1, 3}, {2, 5}, {4, 4}}, 7), vector<int>{0, 1, 2, 2, 2, 1, 0}, "difference array");
    H::check(countContaining({{1, 3}, {2, 5}, {4, 4}}, 4), 2, "point query");
