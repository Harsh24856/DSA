class Solution {
public:
    int brokenCalc(int startValue, int target) {
        int steps = 0;
        while (target > startValue) {   // work backwards: halve when even, else add one
            target = target % 2 == 0 ? target / 2 : target + 1;
            steps++;
        }
        return steps + startValue - target;
    }
};
