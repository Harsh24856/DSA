class Solution {
public:
    int kSimilarity(string s1, string s2) {
        queue<string> q;
        q.push(s1);
        unordered_set<string> seen{s1};
        for (int steps = 0;; steps++) {          // BFS, one swap per level
            for (int k = q.size(); k > 0; k--) {
                string s = q.front();
                q.pop();
                if (s == s2) return steps;
                int i = 0;
                while (s[i] == s2[i]) i++;       // first wrong position
                for (int j = i + 1; j < (int)s.size(); j++)
                    if (s[j] == s2[i] && s[j] != s2[j]) {   // a swap that fixes position i
                        string t = s;
                        swap(t[i], t[j]);
                        if (seen.insert(t).second) q.push(t);
                    }
            }
        }
    }
};
