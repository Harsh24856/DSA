class StreamChecker {
    struct Node { Node* next[26] = {}; bool end = false; };
    Node* root = new Node();
    int longest = 0;
    string stream;
public:
    StreamChecker(vector<string>& words) {
        for (auto& w : words) {
            longest = max(longest, (int)w.size());
            Node* node = root;
            for (int i = w.size() - 1; i >= 0; i--) {      // store each word reversed
                int c = w[i] - 'a';
                if (!node->next[c]) node->next[c] = new Node();
                node = node->next[c];
            }
            node->end = true;
        }
    }

    bool query(char letter) {
        stream.push_back(letter);
        Node* node = root;
        // walk the stream newest to oldest, at most `longest` letters
        for (int i = stream.size() - 1; i >= 0 && i >= (int)stream.size() - longest; i--) {
            node = node->next[stream[i] - 'a'];
            if (!node) return false;
            if (node->end) return true;
        }
        return false;
    }
};
// @test
    vector<string> words{"cd", "f", "kl"};
    StreamChecker s(words);
    vector<bool> got;
    for (char c : string("abcdefghijkl")) got.push_back(s.query(c));
    H::check(got, vector<bool>{false,false,false,true,false,true,false,false,false,false,false,true}, "StreamChecker");
