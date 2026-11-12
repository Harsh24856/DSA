class Solution {
public:
    int maximumWhiteTiles(vector<vector<int>>& tiles, int carpetLen) {
        sort(tiles.begin(), tiles.end());
        int n = tiles.size(), best = 0, cover = 0, j = 0;
        for (int i = 0; i < n; i++) {
            int s = tiles[i][0], e = tiles[i][1];
            int end = s + carpetLen;                   // carpet starts at s, covers [s, end)
            while (j < n && tiles[j][1] < end) {       // tiles fully under the carpet
                cover += tiles[j][1] - tiles[j][0] + 1;
                j++;
            }
            int part = j < n ? max(0, end - tiles[j][0]) : 0;   // part of the next tile
            best = max(best, cover + part);
            if (best >= carpetLen) return carpetLen;
            cover -= e - s + 1;                        // tile i leaves the window
        }
        return best;
    }
};
