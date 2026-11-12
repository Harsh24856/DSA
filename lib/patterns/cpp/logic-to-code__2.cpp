// rotate 90 degrees clockwise in place: transpose across the main diagonal, then reverse every row
void rotateMatrix(vector<vector<int>>& m) {
    int n = m.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);   // j > i: each pair swaps once
    for (auto& row : m) reverse(row.begin(), row.end());
}

// rotate right by k in place: reverse all, then reverse the first k and the rest
void rotateArray(vector<int>& a, int k) {
    if (a.empty()) return;
    k %= (int)a.size();
    reverse(a.begin(), a.end());
    reverse(a.begin(), a.begin() + k);
    reverse(a.begin() + k, a.end());
}
// @test
    vector<vector<int>> m{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    rotateMatrix(m);
    H::check(m, vector<vector<int>>{{7, 4, 1}, {8, 5, 2}, {9, 6, 3}}, "3 x 3");
    vector<vector<int>> one{{5}};
    rotateMatrix(one);
    H::check(one, vector<vector<int>>{{5}}, "1 x 1");
    vector<int> a{1, 2, 3, 4, 5, 6, 7};
    rotateArray(a, 3);
    H::check(a, vector<int>{5, 6, 7, 1, 2, 3, 4}, "array by 3");
    vector<int> b{-1, -100, 3, 99};
    rotateArray(b, 6);
    H::check(b, vector<int>{3, 99, -1, -100}, "k larger than n");
    vector<int> e;
    rotateArray(e, 2);
    H::check(e, vector<int>{}, "empty");
