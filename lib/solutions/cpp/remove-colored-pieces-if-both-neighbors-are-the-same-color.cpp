class Solution {
public:
    bool winnerOfGame(string colors) {
        int a = 0, b = 0;   // moves each player has
        for (int i = 1; i + 1 < (int)colors.size(); i++)
            if (colors[i - 1] == colors[i] && colors[i] == colors[i + 1]) {
                if (colors[i] == 'A') a++;
                else b++;
            }
        return a > b;
    }
};
