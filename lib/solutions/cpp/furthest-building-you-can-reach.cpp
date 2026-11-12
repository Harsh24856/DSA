class Solution {
public:
    int furthestBuilding(vector<int>& heights, int bricks, int ladders) {
        priority_queue<int, vector<int>, greater<int>> heap;   // climbs covered by ladders
        for (int i = 0; i + 1 < (int)heights.size(); i++) {
            int d = heights[i + 1] - heights[i];
            if (d <= 0) continue;
            heap.push(d);
            if ((int)heap.size() > ladders) {    // the smallest climb uses bricks instead
                bricks -= heap.top();
                heap.pop();
                if (bricks < 0) return i;
            }
        }
        return heights.size() - 1;
    }
};
