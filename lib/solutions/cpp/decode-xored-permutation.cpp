class Solution {
public:
    vector<int> decode(vector<int>& encoded) {
        int n = (int)encoded.size() + 1, total = 0, rest = 0;
        for (int i = 1; i <= n; i++) total ^= i;             // XOR of the whole permutation
        for (int i = 1; i < n - 1; i += 2) rest ^= encoded[i];   // XOR of every element but the first
        vector<int> perm{total ^ rest};
        for (int e : encoded) perm.push_back(perm.back() ^ e);
        return perm;
    }
};
