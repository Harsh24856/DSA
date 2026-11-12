class Solution {
    unordered_map<string, string> parent;
    string find(string x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];                   // path halving
            x = parent[x];
        }
        return x;
    }
public:
    vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {
        unordered_map<string, string> owner;
        for (auto& acc : accounts)
            for (size_t i = 1; i < acc.size(); i++) {
                if (!parent.count(acc[i])) parent[acc[i]] = acc[i];
                owner[acc[i]] = acc[0];
                parent[find(acc[i])] = find(acc[1]);         // join with the account's first email
            }
        unordered_map<string, vector<string>> groups;        // root -> its emails
        for (auto& [e, p] : parent) groups[find(e)].push_back(e);
        vector<vector<string>> out;
        for (auto& [root, es] : groups) {
            sort(es.begin(), es.end());
            vector<string> row{owner[root]};
            row.insert(row.end(), es.begin(), es.end());
            out.push_back(row);
        }
        return out;
    }
};
// @test
    vector<vector<string>> a1 = {{"John", "johnsmith@mail.com", "john_newyork@mail.com"}, {"John", "johnsmith@mail.com", "john00@mail.com"}, {"Mary", "mary@mail.com"}, {"John", "johnnybravo@mail.com"}};
    vector<vector<string>> e1 = {{"John", "john00@mail.com", "john_newyork@mail.com", "johnsmith@mail.com"}, {"Mary", "mary@mail.com"}, {"John", "johnnybravo@mail.com"}};
    H::check(H::sorted(Solution().accountsMerge(a1)), H::sorted(e1), "accountsMerge 1");
    vector<vector<string>> a2 = {{"Gabe", "Gabe0@m.co", "Gabe3@m.co", "Gabe1@m.co"}, {"Kevin", "Kevin3@m.co", "Kevin5@m.co", "Kevin0@m.co"}, {"Ethan", "Ethan5@m.co", "Ethan4@m.co", "Ethan0@m.co"}, {"Hanzo", "Hanzo3@m.co", "Hanzo1@m.co", "Hanzo0@m.co"}, {"Fern", "Fern5@m.co", "Fern1@m.co", "Fern0@m.co"}};
    vector<vector<string>> e2 = {{"Ethan", "Ethan0@m.co", "Ethan4@m.co", "Ethan5@m.co"}, {"Gabe", "Gabe0@m.co", "Gabe1@m.co", "Gabe3@m.co"}, {"Hanzo", "Hanzo0@m.co", "Hanzo1@m.co", "Hanzo3@m.co"}, {"Kevin", "Kevin0@m.co", "Kevin3@m.co", "Kevin5@m.co"}, {"Fern", "Fern0@m.co", "Fern1@m.co", "Fern5@m.co"}};
    H::check(H::sorted(Solution().accountsMerge(a2)), H::sorted(e2), "accountsMerge 2");
