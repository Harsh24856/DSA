class Solution {
public:
    vector<string> letterCasePermutation(string s) {
        vector<string> out{""};
        for (char c : s) {
            vector<string> next;
            for (auto& p : out) {
                if (isalpha(c)) {   // a letter doubles the list
                    next.push_back(p + (char)tolower(c));
                    next.push_back(p + (char)toupper(c));
                } else {
                    next.push_back(p + c);
                }
            }
            out = next;
        }
        return out;
    }
};
// @test
    H::check(H::sorted(Solution().letterCasePermutation("a1b2")), H::sorted(vector<string>{"a1b2", "a1B2", "A1b2", "A1B2"}), "a1b2");
    H::check(H::sorted(Solution().letterCasePermutation("3z4")), H::sorted(vector<string>{"3z4", "3Z4"}), "3z4");
    H::check(Solution().letterCasePermutation("1"), vector<string>{"1"}, "1");
