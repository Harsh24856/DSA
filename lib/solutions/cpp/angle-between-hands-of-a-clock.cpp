class Solution {
public:
    double angleClock(int hour, int minutes) {
        double m = 6.0 * minutes;                       // minute hand: 6 degrees a minute
        double h = 30.0 * (hour % 12) + 0.5 * minutes;  // hour hand also moves half a degree a minute
        double d = fabs(h - m);
        return min(d, 360 - d);
    }
};
