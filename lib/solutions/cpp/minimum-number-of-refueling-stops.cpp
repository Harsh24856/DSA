class Solution {
public:
    int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {
        priority_queue<int> heap;   // fuel of stations we passed, biggest on top
        long long fuel = startFuel;
        int stops = 0, i = 0;
        while (fuel < target) {
            while (i < (int)stations.size() && stations[i][0] <= fuel) heap.push(stations[i++][1]);
            if (heap.empty()) return -1;
            fuel += heap.top();   // stop at the best station we could have reached
            heap.pop();
            stops++;
        }
        return stops;
    }
};
