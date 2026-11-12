class Solution {
    static const int MOD = 1e9 + 7;

    static int primes(int x) {   // number of distinct prime factors
        int c = 0;
        for (int d = 2; d * d <= x; d++)
            if (x % d == 0) {
                c++;
                while (x % d == 0) x /= d;
            }
        return c + (x > 1);
    }

    static long long power(long long b, long long e) {
        long long r = 1;
        for (b %= MOD; e; e >>= 1, b = b * b % MOD)
            if (e & 1) r = r * b % MOD;
        return r;
    }

public:
    int maximumScore(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> s(n);
        for (int i = 0; i < n; i++) s[i] = primes(nums[i]);
        // nums[i] wins every subarray in (left[i], right[i]) that contains i
        vector<int> left(n, -1), right(n, n), st;
        for (int i = 0; i < n; i++) {
            while (!st.empty() && s[st.back()] < s[i]) {
                right[st.back()] = i;
                st.pop_back();
            }
            left[i] = st.empty() ? -1 : st.back();
            st.push_back(i);
        }
        vector<int> order(n);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return nums[a] > nums[b]; });   // biggest factor first
        long long ans = 1, left_k = k;
        for (int i : order) {
            long long take = min(left_k, (long long)(i - left[i]) * (right[i] - i));
            ans = ans * power(nums[i], take) % MOD;
            if ((left_k -= take) == 0) break;
        }
        return ans;
    }
};
