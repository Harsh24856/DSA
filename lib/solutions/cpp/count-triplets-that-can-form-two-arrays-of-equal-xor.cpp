class Solution {
public:
    int countTriplets(vector<int>& arr) {
        int n = arr.size();
        vector<int> X(n + 1, 0);   // X[i] = xor of arr[0..i-1]
        for (int i = 0; i < n; i++) X[i + 1] = X[i] ^ arr[i];
        int ans = 0;
        for (int i = 0; i < n; i++)
            for (int k = i + 1; k < n; k++)
                if (X[i] == X[k + 1]) ans += k - i;   // any j in (i, k] works
        return ans;
    }
};
