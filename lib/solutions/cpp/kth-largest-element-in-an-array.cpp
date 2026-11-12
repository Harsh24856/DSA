class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> h;  // min-heap of the k largest
        for (int x : nums) {
            h.push(x);
            if ((int)h.size() > k) h.pop();
        }
        return h.top();
    }
};
