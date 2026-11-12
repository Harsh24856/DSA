class Solution {
public:
    int minimumPushes(string word) {
        vector<int> freq(26, 0);
        for (char c : word) freq[c - 'a']++;
        sort(freq.rbegin(), freq.rend());   // commonest letters get the first press
        int total = 0;
        for (int i = 0; i < 26; i++) total += freq[i] * (i / 8 + 1);   // 8 keys per press level
        return total;
    }
};
