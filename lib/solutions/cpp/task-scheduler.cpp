class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        int cnt[26] = {};
        for (char t : tasks) cnt[t - 'A']++;
        int top = *max_element(cnt, cnt + 26);
        int ties = count(cnt, cnt + 26, top);            // tasks that share the top count fill the last row
        return max((int)tasks.size(), (top - 1) * (n + 1) + ties);
    }
};
