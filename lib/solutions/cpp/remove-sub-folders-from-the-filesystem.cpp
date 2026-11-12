class Solution {
public:
    vector<string> removeSubfolders(vector<string>& folder) {
        sort(folder.begin(), folder.end());            // a parent sorts right before its subfolders
        vector<string> out;
        for (const string& f : folder)
            if (out.empty() || !f.starts_with(out.back() + "/")) out.push_back(f);
        return out;
    }
};
