// Boyer-Moore vote: pair off different values; a value that fills more than half survives the pairing
int majority(const vector<int>& a) {
    int cand = 0, count = 0;
    for (int x : a) {
        if (count == 0) cand = x;           // every earlier vote has cancelled: start a new candidate
        count += x == cand ? 1 : -1;
    }
    return cand;                            // only correct if a majority exists; else verify with a second pass
}

bool isMajority(const vector<int>& a, int cand) {
    return 2 * count(a.begin(), a.end(), cand) > (long long)a.size();
}
// @test
    H::check(majority({3, 2, 3}), 3, "3 2 3");
    H::check(majority({2, 2, 1, 1, 1, 2, 2}), 2, "classic");
    H::check(majority({1}), 1, "one");
    H::check(majority({1, 2, 1, 2, 1}), 1, "alternating");
    H::check(isMajority({1, 2, 3}, majority({1, 2, 3})), false, "no majority: the check says so");
    H::check(isMajority({2, 2, 1}, majority({2, 2, 1})), true, "verified");
