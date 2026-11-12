// pairs i < j with a[i] + a[j] divisible by k
long long solve(vector<int> a, int k) {
    long long count = 0;
    for (size_t i = 0; i < a.size(); i++)
        for (size_t j = i + 1; j < a.size(); j++)
            if ((a[i] + a[j]) % k == 0) count++;
    return count;
}
