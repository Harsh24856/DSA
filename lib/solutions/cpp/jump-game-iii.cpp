class Solution {
public:
    bool canReach(vector<int>& arr, int start) {
        int n = arr.size();
        vector<bool> seen(n, false);
        vector<int> stack{start};
        while (!stack.empty()) {
            int i = stack.back(); stack.pop_back();
            if (arr[i] == 0) return true;
            seen[i] = true;
            for (int j : {i + arr[i], i - arr[i]})
                if (0 <= j && j < n && !seen[j]) stack.push_back(j);
        }
        return false;
    }
};
