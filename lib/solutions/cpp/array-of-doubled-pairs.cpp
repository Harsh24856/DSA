class Solution {
public:
    bool canReorderDoubled(vector<int>& arr) {
        unordered_map<int, int> c;
        for (int x : arr) c[x]++;
        vector<int> keys;
        for (auto& [x, k] : c) keys.push_back(x);
        sort(keys.begin(), keys.end(), [](int a, int b) { return abs(a) < abs(b); });   // smallest size first
        for (int x : keys) {
            if (c[x] > c[2 * x]) return false;   // every x needs its own 2x
            c[2 * x] -= c[x];
        }
        return true;
    }
};
