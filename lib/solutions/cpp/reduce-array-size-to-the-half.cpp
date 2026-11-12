class Solution {
public:
    int minSetSize(vector<int>& arr) {
        unordered_map<int, int> freq;
        for (int x : arr) freq[x]++;
        vector<int> counts;
        for (auto& [v, c] : freq) counts.push_back(c);
        sort(counts.rbegin(), counts.rend());   // most common first
        int removed = 0;
        for (int i = 0; i < (int)counts.size(); i++) {
            removed += counts[i];
            if (removed * 2 >= (int)arr.size()) return i + 1;
        }
        return counts.size();
    }
};
