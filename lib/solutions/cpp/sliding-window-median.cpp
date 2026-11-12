class Solution {
public:
    vector<double> medianSlidingWindow(vector<int>& nums, int k) {
        vector<int> win(nums.begin(), nums.begin() + k);   // the window, kept sorted
        sort(win.begin(), win.end());
        vector<double> out;
        for (int i = k; i <= (int)nums.size(); i++) {
            if (k % 2) out.push_back(win[k / 2]);
            else out.push_back(((double)win[k / 2 - 1] + win[k / 2]) / 2);
            if (i == (int)nums.size()) break;
            win.erase(lower_bound(win.begin(), win.end(), nums[i - k]));
            win.insert(upper_bound(win.begin(), win.end(), nums[i]), nums[i]);
        }
        return out;
    }
};
