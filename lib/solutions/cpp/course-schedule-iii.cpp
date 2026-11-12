class Solution {
public:
    int scheduleCourse(vector<vector<int>>& courses) {
        sort(courses.begin(), courses.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // earliest deadline first
        priority_queue<int> heap;   // durations taken, longest on top
        int t = 0;
        for (auto& c : courses) {
            t += c[0];
            heap.push(c[0]);
            if (t > c[1]) {   // over the deadline: drop the longest course so far
                t -= heap.top();
                heap.pop();
            }
        }
        return heap.size();
    }
};
