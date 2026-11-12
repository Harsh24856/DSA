class FreqStack {
    unordered_map<int, int> freq;                        // value to its count
    unordered_map<int, vector<int>> group;               // count to the values pushed at that count, in order
    int top = 0;                                         // highest count right now

public:
    FreqStack() {}

    void push(int val) {
        int f = ++freq[val];
        top = max(top, f);
        group[f].push_back(val);
    }

    int pop() {
        int val = group[top].back();                     // most frequent, latest pushed among ties
        group[top].pop_back();
        freq[val]--;
        if (group[top].empty()) top--;
        return val;
    }
};
// @test
    FreqStack fs;
    for (int v : {5, 7, 5, 7, 4, 5}) fs.push(v);
    vector<int> got;
    for (int i = 0; i < 4; i++) got.push_back(fs.pop());
    H::check(got, vector<int>{5, 7, 5, 4}, "FreqStack");
