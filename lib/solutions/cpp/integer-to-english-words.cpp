class Solution {
    const vector<string> ONES = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                                 "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
    const vector<string> TENS = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

    void three(int n, vector<string>& out) {             // words for 1 to 999
        if (n >= 100) { out.push_back(ONES[n / 100]); out.push_back("Hundred"); n %= 100; }
        if (n >= 20) { out.push_back(TENS[n / 10]); n %= 10; }
        if (n) out.push_back(ONES[n]);
    }

public:
    string numberToWords(int num) {
        if (num == 0) return "Zero";
        vector<string> words;
        pair<int, string> scales[] = {{1000000000, "Billion"}, {1000000, "Million"}, {1000, "Thousand"}, {1, ""}};
        for (auto& [scale, name] : scales)
            if (num >= scale) {
                three(num / scale, words);
                if (!name.empty()) words.push_back(name);
                num %= scale;
            }
        string out;
        for (auto& w : words) out += (out.empty() ? "" : " ") + w;
        return out;
    }
};
