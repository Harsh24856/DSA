class Solution {
public:
    int compress(vector<char>& chars) {
        int w = 0, n = chars.size();
        for (int i = 0; i < n; ) {
            int j = i;
            while (j < n && chars[j] == chars[i]) j++;    // the run is chars[i..j-1]
            chars[w++] = chars[i];
            if (j - i > 1)
                for (char d : to_string(j - i)) chars[w++] = d;
            i = j;
        }
        return w;
    }
};
// @test
    vector<char> a{'a', 'a', 'b', 'b', 'c', 'c', 'c'};
    int k = Solution().compress(a);
    H::check(string(a.begin(), a.begin() + k), string("a2b2c3"), "compress example 1");
    vector<char> b{'a'};
    k = Solution().compress(b);
    H::check(string(b.begin(), b.begin() + k), string("a"), "compress example 2");
    vector<char> c{'a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'};
    k = Solution().compress(c);
    H::check(string(c.begin(), c.begin() + k), string("ab12"), "compress example 3");
    vector<char> d(100, 'x');
    k = Solution().compress(d);
    H::check(string(d.begin(), d.begin() + k), string("x100"), "three digit count");
