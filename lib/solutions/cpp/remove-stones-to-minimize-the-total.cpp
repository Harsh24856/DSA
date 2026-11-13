class Solution {
public:
    int minStoneSum(vector<int>& piles, int k) {
        priority_queue<int> h(piles.begin(), piles.end());   // max-heap, built in O(n)
        while (k--) {
            int x = h.top();
            h.pop();
            h.push(x - x / 2);                                // halve the biggest pile
        }
        int total = 0;
        while (!h.empty()) { total += h.top(); h.pop(); }
        return total;
    }
};
