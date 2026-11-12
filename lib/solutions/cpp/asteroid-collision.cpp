class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> stack;
        for (int a : asteroids) {
            bool alive = true;
            while (alive && a < 0 && !stack.empty() && stack.back() > 0) {   // a left-mover meets a right-mover
                if (stack.back() < -a) { stack.pop_back(); continue; }     // the right-mover explodes
                if (stack.back() == -a) stack.pop_back();                   // both explode
                alive = false;
            }
            if (alive) stack.push_back(a);
        }
        return stack;
    }
};
