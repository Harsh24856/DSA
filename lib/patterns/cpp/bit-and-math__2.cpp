// a ^ a = 0 and a ^ 0 = a: pairs cancel, the unpaired value is left
int singleNumber(const vector<int>& nums) {
    int acc = 0;
    for (int x : nums) acc ^= x;
    return acc;
}

// XOR every index 0..n with every value; the missing one has no partner
int missingNumber(const vector<int>& nums) {
    int acc = nums.size();
    for (int i = 0; i < (int)nums.size(); i++) acc ^= i ^ nums[i];
    return acc;
}
// @test
    H::check(singleNumber({4, 1, 2, 1, 2}), 4, "single number");
    H::check(singleNumber({-3, 7, 7}), -3, "negative");
    H::check(missingNumber({3, 0, 1}), 2, "missing middle");
    H::check(missingNumber({0, 1}), 2, "missing n");
