class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        sort(people.begin(), people.end());
        int i = 0, j = (int)people.size() - 1, boats = 0;
        while (i <= j) {
            if (people[i] + people[j] <= limit) i++;         // lightest rides with the heaviest if they fit
            j--;
            boats++;
        }
        return boats;
    }
};
