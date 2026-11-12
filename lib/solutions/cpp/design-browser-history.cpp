class BrowserHistory {
    vector<string> pages;
    int cur = 0, end = 0;

public:
    BrowserHistory(string homepage) : pages{homepage} {}

    void visit(string url) {
        cur++;
        if (cur == (int)pages.size()) pages.push_back(url);
        else pages[cur] = url;
        end = cur;                            // forward pages are gone
    }

    string back(int steps) {
        cur = max(0, cur - steps);
        return pages[cur];
    }

    string forward(int steps) {
        cur = min(end, cur + steps);
        return pages[cur];
    }
};
// @test
    BrowserHistory b("leetcode.com");
    b.visit("google.com");
    b.visit("facebook.com");
    b.visit("youtube.com");
    H::check(b.back(1), string("facebook.com"), "back 1");
    H::check(b.back(1), string("google.com"), "back 1 again");
    H::check(b.forward(1), string("facebook.com"), "forward 1");
    b.visit("linkedin.com");
    H::check(b.forward(2), string("linkedin.com"), "forward 2");
    H::check(b.back(2), string("google.com"), "back 2");
    H::check(b.back(7), string("leetcode.com"), "back 7");
