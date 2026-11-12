class Solution {
public:
    vector<int> findAllPeople(int n, vector<vector<int>>& meetings, int firstPerson) {
        vector<int> p(n);
        iota(p.begin(), p.end(), 0);
        auto find = [&](int x) {
            while (p[x] != x) {
                p[x] = p[p[x]];
                x = p[x];
            }
            return x;
        };
        p[firstPerson] = 0;
        sort(meetings.begin(), meetings.end(), [](auto& a, auto& b) { return a[2] < b[2]; });
        for (size_t i = 0; i < meetings.size();) {
            size_t j = i;
            while (j < meetings.size() && meetings[j][2] == meetings[i][2]) j++;
            for (size_t k = i; k < j; k++) p[find(meetings[k][0])] = find(meetings[k][1]);   // join everyone meeting at this time
            for (size_t k = i; k < j; k++)
                for (int z : {meetings[k][0], meetings[k][1]})
                    if (find(z) != find(0)) p[z] = z;   // did not learn the secret: undo the join
            i = j;
        }
        vector<int> out;
        for (int k = 0; k < n; k++)
            if (find(k) == find(0)) out.push_back(k);
        return out;
    }
};
