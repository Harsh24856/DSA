class Solution {
    int parent[26];
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
public:
    string smallestEquivalentString(string s1, string s2, string baseStr) {
        iota(parent, parent + 26, 0);
        for (size_t i = 0; i < s1.size(); i++) {
            int ra = find(s1[i] - 'a'), rb = find(s2[i] - 'a');
            if (ra != rb) parent[max(ra, rb)] = min(ra, rb);   // the smaller letter is the root
        }
        for (char& c : baseStr) c = 'a' + find(c - 'a');
        return baseStr;
    }
};
