class Solution {
public:
    string predictPartyVictory(string senate) {
        int n = senate.size();
        queue<int> r, d;
        for (int i = 0; i < n; i++) (senate[i] == 'R' ? r : d).push(i);
        while (!r.empty() && !d.empty()) {
            int a = r.front(), b = d.front(); r.pop(); d.pop();
            if (a < b) r.push(a + n);              // a bans b and waits for the next round
            else d.push(b + n);
        }
        return r.empty() ? "Dire" : "Radiant";
    }
};
