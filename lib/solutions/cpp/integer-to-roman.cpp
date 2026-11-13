class Solution {
public:
    string intToRoman(int num) {
        static const pair<int, const char*> table[] = {{1000, "M"}, {900, "CM"}, {500, "D"}, {400, "CD"}, {100, "C"}, {90, "XC"},
                                                       {50, "L"}, {40, "XL"}, {10, "X"}, {9, "IX"}, {5, "V"}, {4, "IV"}, {1, "I"}};
        string out;
        for (auto [value, sym] : table)                   // largest symbol that still fits, greedily
            while (num >= value) out += sym, num -= value;
        return out;
    }
};
