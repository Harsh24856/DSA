class Solution {
public:
    vector<int> findArray(vector<int>& pref) {
        vector<int> out{pref[0]};
        for (int i = 1; i < (int)pref.size(); i++) out.push_back(pref[i] ^ pref[i - 1]);   // xor cancels the shared prefix
        return out;
    }
};
