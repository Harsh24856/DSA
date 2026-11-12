// Dutch national flag: [0, lo) holds 0s, [lo, mid) holds 1s, (hi, n) holds 2s, [mid, hi] is unknown
void sortColors(vector<int>& a) {
    int lo = 0, mid = 0, hi = (int)a.size() - 1;
    while (mid <= hi) {
        if (a[mid] == 0) swap(a[lo++], a[mid++]);
        else if (a[mid] == 1) mid++;
        else swap(a[mid], a[hi--]);            // do not advance mid: the value swapped in is unchecked
    }
}
// @test
    vector<int> a{2, 0, 2, 1, 1, 0};
    sortColors(a);
    H::check(a, vector<int>{0, 0, 1, 1, 2, 2}, "mixed");
    vector<int> b{2, 0, 1};
    sortColors(b);
    H::check(b, vector<int>{0, 1, 2}, "three");
    vector<int> c{2, 2, 0};
    sortColors(c);
    H::check(c, vector<int>{0, 2, 2}, "swap from hi");
    vector<int> d;
    sortColors(d);
    H::check(d, vector<int>{}, "empty");
