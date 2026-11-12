class Solution {
public:
    string largestNumber(vector<int>& nums) {
        vector<string> s;
        for (int x : nums) s.push_back(to_string(x));
        sort(s.begin(), s.end(), [](const string& a, const string& b) { return a + b > b + a; });   // a goes first if ab beats ba
        if (s[0] == "0") return "0";
        string out;
        for (auto& x : s) out += x;
        return out;
    }
};
