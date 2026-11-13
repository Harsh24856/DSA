class Solution {
public:
    string fractionToDecimal(int numerator, int denominator) {
        if (numerator == 0) return "0";
        string out = ((numerator < 0) != (denominator < 0)) ? "-" : "";
        long long n = llabs((long long)numerator), d = llabs((long long)denominator);   // |INT_MIN| needs 64 bits
        out += to_string(n / d);
        long long r = n % d;
        if (r == 0) return out;
        out += '.';
        unordered_map<long long, int> seen;        // remainder -> where its digit goes
        while (r && !seen.count(r)) {
            seen[r] = out.size();
            r *= 10;
            out += char('0' + r / d);
            r %= d;
        }
        if (r) { out.insert(seen[r], "("); out += ')'; }
        return out;
    }
};
