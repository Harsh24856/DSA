class Solution {
public:
    vector<string> wordSubsets(vector<string>& words1, vector<string>& words2) {
        array<int, 26> need{};   // most of each letter any word in words2 needs
        for (auto& b : words2) {
            array<int, 26> c{};
            for (char ch : b) c[ch - 'a']++;
            for (int i = 0; i < 26; i++) need[i] = max(need[i], c[i]);
        }
        vector<string> out;
        for (auto& a : words1) {
            array<int, 26> c{};
            for (char ch : a) c[ch - 'a']++;
            bool ok = true;
            for (int i = 0; i < 26; i++) ok &= c[i] >= need[i];
            if (ok) out.push_back(a);
        }
        return out;
    }
};
