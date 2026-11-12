class Solution {
public:
    string getHappyString(int n, int k) {
        if (k > 3 * (1 << (n - 1))) return "";
        k--;
        string out;
        for (int i = 0; i < n; i++) {
            int block = 1 << (n - 1 - i);       // strings that share each choice here
            string opts;
            for (char c : string("abc"))
                if (out.empty() || c != out.back()) opts += c;
            out += opts[k / block];
            k %= block;
        }
        return out;
    }
};
