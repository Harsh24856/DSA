// cut when i reaches the last occurrence of every character seen in this part
vector<int> partitionLabels(const string& s) {
    array<int, 26> last{};
    for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;   // full first pass
    vector<int> out;
    int start = 0, end = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        end = max(end, last[s[i] - 'a']);
        if (i == end) { out.push_back(end - start + 1); start = i + 1; }
    }
    return out;
}
// @test
    H::check(partitionLabels("ababcbacadefegdehijhklij"), vector<int>{9, 7, 8}, "partition labels");
    H::check(partitionLabels("eccbbbbdec"), vector<int>{10}, "one part");
    H::check(partitionLabels("abc"), vector<int>{1, 1, 1}, "all distinct");
