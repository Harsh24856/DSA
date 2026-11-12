class Solution {
public:
    vector<int> xorQueries(vector<int>& arr, vector<vector<int>>& queries) {
        vector<int> X{0};                                    // prefix XORs
        for (int v : arr) X.push_back(X.back() ^ v);
        vector<int> out;
        for (auto& q : queries) out.push_back(X[q[1] + 1] ^ X[q[0]]);   // the shared prefix cancels
        return out;
    }
};
