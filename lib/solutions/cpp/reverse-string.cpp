class Solution {
public:
    void reverseString(vector<char>& s) {
        int l = 0, r = (int)s.size() - 1;
        while (l < r) swap(s[l++], s[r--]);            // swap the ends and move inward
    }
};
// @test
    vector<char> a{'h', 'e', 'l', 'l', 'o'};
    Solution().reverseString(a);
    H::check(a, vector<char>{'o', 'l', 'l', 'e', 'h'}, "hello");
    vector<char> b{'H', 'a', 'n', 'n', 'a', 'h'};
    Solution().reverseString(b);
    H::check(b, vector<char>{'h', 'a', 'n', 'n', 'a', 'H'}, "Hannah");
