class Solution {
public:
    int maximumSwap(int num) {
        string d = to_string(num);
        int last[10];
        fill(last, last + 10, -1);
        for (int i = 0; i < (int)d.size(); i++) last[d[i] - '0'] = i;   // last place of each digit
        for (int i = 0; i < (int)d.size(); i++)
            for (int big = 9; big > d[i] - '0'; big--)
                if (last[big] > i) {                     // a bigger digit later on: swap it forward
                    swap(d[i], d[last[big]]);
                    return stoi(d);
                }
        return num;
    }
};
