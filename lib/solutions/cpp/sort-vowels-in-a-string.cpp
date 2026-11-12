class Solution {
public:
    string sortVowels(string s) {
        auto isVowel = [](char c) { return string("aeiouAEIOU").find(c) != string::npos; };
        string vowels;
        for (char c : s)
            if (isVowel(c)) vowels += c;
        sort(vowels.begin(), vowels.end());   // uppercase sorts before lowercase in ASCII
        int k = 0;
        for (char& c : s)
            if (isVowel(c)) c = vowels[k++];
        return s;
    }
};
