class Solution {
public:
    int minOperations(vector<int>& target, vector<int>& arr) {
        unordered_map<int, int> pos;   // target values are distinct
        for (int i = 0; i < (int)target.size(); i++) pos[target[i]] = i;
        vector<int> tails;   // longest increasing subsequence of positions
        for (int x : arr) {
            auto it = pos.find(x);
            if (it == pos.end()) continue;
            auto k = lower_bound(tails.begin(), tails.end(), it->second);
            if (k == tails.end()) tails.push_back(it->second);
            else *k = it->second;
        }
        return target.size() - tails.size();
    }
};
