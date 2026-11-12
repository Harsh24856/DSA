class Solution {
public:
    int wateringPlants(vector<int>& plants, int capacity) {
        int steps = 0, water = capacity;
        for (int i = 0; i < (int)plants.size(); i++) {
            if (water < plants[i]) {   // walk back to the river and return
                steps += 2 * i;
                water = capacity;
            }
            water -= plants[i];
            steps++;
        }
        return steps;
    }
};
