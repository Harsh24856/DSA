class FoodRatings {
    unordered_map<string, pair<string, int>> info;   // food -> (cuisine, current rating)
    // per cuisine: (-rating, food), so the top is the best rating, then the smallest name
    unordered_map<string, priority_queue<pair<int, string>, vector<pair<int, string>>, greater<>>> heaps;
public:
    FoodRatings(vector<string>& foods, vector<string>& cuisines, vector<int>& ratings) {
        for (size_t i = 0; i < foods.size(); i++) {
            info[foods[i]] = {cuisines[i], ratings[i]};
            heaps[cuisines[i]].push({-ratings[i], foods[i]});
        }
    }

    void changeRating(string food, int newRating) {
        auto& [c, r] = info[food];
        r = newRating;
        heaps[c].push({-newRating, food});   // the old entry stays and goes stale
    }

    string highestRated(string cuisine) {
        auto& h = heaps[cuisine];
        while (-h.top().first != info[h.top().second].second) h.pop();   // drop stale entries
        return h.top().second;
    }
};
// @test
    vector<string> foods{"kimchi", "miso", "sushi", "moussaka", "ramen", "bulgogi"};
    vector<string> cuisines{"korean", "japanese", "japanese", "greek", "japanese", "korean"};
    vector<int> ratings{9, 12, 8, 15, 14, 7};
    FoodRatings f(foods, cuisines, ratings);
    H::check(f.highestRated("korean"), string("kimchi"), "korean");
    H::check(f.highestRated("japanese"), string("ramen"), "japanese");
    f.changeRating("sushi", 16);
    H::check(f.highestRated("japanese"), string("sushi"), "after sushi 16");
    f.changeRating("ramen", 16);
    H::check(f.highestRated("japanese"), string("ramen"), "tie goes to the smaller name");
