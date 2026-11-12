class Solution {
public:
    vector<int> sortJumbled(vector<int>& mapping, vector<int>& nums) {
        auto key = [&](int x) {   // map each digit, read the result as a number
            string d = to_string(x);
            int v = 0;
            for (char c : d) v = v * 10 + mapping[c - '0'];
            return v;
        };
        vector<pair<int, int>> keyed;
        for (int x : nums) keyed.push_back({key(x), x});
        stable_sort(keyed.begin(), keyed.end(), [](auto& a, auto& b) { return a.first < b.first; });   // ties keep input order
        vector<int> out;
        for (auto& [k, x] : keyed) out.push_back(x);
        return out;
    }
};
