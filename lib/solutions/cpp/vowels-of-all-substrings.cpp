class Solution {
public:
    long long countVowels(string word) {
        long long n = word.size(), total = 0;
        for (long long i = 0; i < n; i++)
            if (string("aeiou").find(word[i]) != string::npos)
                total += (i + 1) * (n - i);                // substrings that contain index i
        return total;
    }
};
