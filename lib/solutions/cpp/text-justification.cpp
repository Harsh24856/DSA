class Solution {
public:
    vector<string> fullJustify(vector<string>& words, int maxWidth) {
        vector<string> out, line;
        int width = 0;                                     // letters on the line, without spaces
        for (const string& w : words) {
            if (width + (int)w.size() + (int)line.size() > maxWidth) {
                int gaps = max((int)line.size() - 1, 1);
                for (int k = 0; k < maxWidth - width; k++) line[k % gaps] += ' ';   // spread spaces left first
                string row;
                for (const string& x : line) row += x;
                out.push_back(row);
                line.clear();
                width = 0;
            }
            line.push_back(w);
            width += w.size();
        }
        string last;                                       // last line: single spaces, padded on the right
        for (size_t i = 0; i < line.size(); i++) last += (i ? " " : "") + line[i];
        last.resize(maxWidth, ' ');
        out.push_back(last);
        return out;
    }
};
