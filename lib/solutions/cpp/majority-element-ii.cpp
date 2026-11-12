class Solution {
public:
    vector<int> majorityElement(vector<int>& nums) {
        optional<int> c1, c2;   // two candidates (Boyer-Moore voting)
        int n1 = 0, n2 = 0;
        for (int x : nums) {
            if (c1 == x) n1++;
            else if (c2 == x) n2++;
            else if (n1 == 0) { c1 = x; n1 = 1; }
            else if (n2 == 0) { c2 = x; n2 = 1; }
            else { n1--; n2--; }
        }
        vector<int> out;
        for (auto c : {c1, c2})   // confirm with a real count
            if (c && count(nums.begin(), nums.end(), *c) > (int)nums.size() / 3) out.push_back(*c);
        return out;
    }
};
