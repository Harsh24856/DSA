class Solution {
public:
    int longestCommonPrefix(vector<int>& arr1, vector<int>& arr2) {
        vector<array<int, 10>> trie(1, array<int, 10>{});   // node 0 is the root, 0 also means "no child"
        for (int x : arr1) {
            int n = 0;
            for (char d : to_string(x)) {
                if (!trie[n][d - '0']) { trie[n][d - '0'] = trie.size(); trie.push_back({}); }
                n = trie[n][d - '0'];
            }
        }
        int best = 0;
        for (int y : arr2) {
            int n = 0, k = 0;
            for (char d : to_string(y)) {
                if (!trie[n][d - '0']) break;             // the shared prefix ends here
                n = trie[n][d - '0'];
                k++;
            }
            best = max(best, k);
        }
        return best;
    }
};
