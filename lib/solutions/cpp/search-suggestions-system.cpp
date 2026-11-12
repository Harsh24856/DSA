class Solution {
public:
    vector<vector<string>> suggestedProducts(vector<string>& products, string searchWord) {
        sort(products.begin(), products.end());
        vector<vector<string>> out;
        string prefix;
        for (char ch : searchWord) {
            prefix += ch;
            auto it = lower_bound(products.begin(), products.end(), prefix);   // first product >= prefix
            vector<string> row;
            for (int k = 0; k < 3 && it != products.end() && it->starts_with(prefix); k++, it++) row.push_back(*it);
            out.push_back(row);
        }
        return out;
    }
};
