class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> out{{}};
        for (int x : nums) {
            size_t size = out.size();
            for (size_t i = 0; i < size; i++) {              // every subset so far, now with x too
                vector<int> s = out[i];
                s.push_back(x);
                out.push_back(s);
            }
        }
        return out;
    }
};
