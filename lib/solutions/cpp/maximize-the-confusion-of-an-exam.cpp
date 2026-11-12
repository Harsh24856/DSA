class Solution {
public:
    int maxConsecutiveAnswers(string answerKey, int k) {
        int t = 0, f = 0, left = 0, best = 0;
        for (int right = 0; right < (int)answerKey.size(); right++) {
            (answerKey[right] == 'T' ? t : f)++;
            while (min(t, f) > k) {              // too many of the minority answer to flip
                (answerKey[left] == 'T' ? t : f)--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};
