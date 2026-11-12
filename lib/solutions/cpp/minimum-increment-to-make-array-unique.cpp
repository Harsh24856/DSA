class Solution {
public:
    int minIncrementForUnique(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        long long moves = 0, need = 0;   // need = smallest value still free
        for (int x : nums) {
            need = max(need, (long long)x);
            moves += need - x;
            need++;
        }
        return moves;
    }
};
