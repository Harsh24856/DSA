class Solution {
public:
    bool canVisitAllRooms(vector<vector<int>>& rooms) {
        vector<bool> seen(rooms.size(), false);
        seen[0] = true;
        vector<int> stack{0};
        int count = 1;
        while (!stack.empty()) {
            int r = stack.back();
            stack.pop_back();
            for (int key : rooms[r])
                if (!seen[key]) {
                    seen[key] = true;
                    count++;
                    stack.push_back(key);
                }
        }
        return count == (int)rooms.size();
    }
};
