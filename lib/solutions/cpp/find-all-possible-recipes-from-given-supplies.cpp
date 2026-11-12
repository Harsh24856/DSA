class Solution {
public:
    vector<string> findAllRecipes(vector<string>& recipes, vector<vector<string>>& ingredients, vector<string>& supplies) {
        unordered_map<string, int> need;               // ingredients a recipe still lacks
        unordered_map<string, vector<string>> users;   // ingredient -> recipes that use it
        for (size_t i = 0; i < recipes.size(); i++) {
            need[recipes[i]] = ingredients[i].size();
            for (const string& x : ingredients[i]) users[x].push_back(recipes[i]);
        }
        queue<string> q;
        for (const string& s : supplies) q.push(s);
        vector<string> out;
        while (!q.empty()) {                           // Kahn's topological order
            string x = q.front(); q.pop();
            for (const string& r : users[x])
                if (--need[r] == 0) { out.push_back(r); q.push(r); }   // a made recipe is a new supply
        }
        return out;
    }
};
