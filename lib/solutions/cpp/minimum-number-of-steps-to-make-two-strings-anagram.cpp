class Solution {
public:
    int minSteps(string s, string t) {
        int need[26] = {};
        for (char c : s) need[c - 'a']++;
        for (char c : t) need[c - 'a']--;
        int steps = 0;
        for (int k : need) if (k > 0) steps += k;   // letters t is short of
        return steps;
    }
};
