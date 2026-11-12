class FindElements {
    unordered_set<int> seen;
public:
    FindElements(TreeNode* root) {
        vector<pair<TreeNode*, int>> stack{{root, 0}};
        while (!stack.empty()) {
            auto [node, v] = stack.back(); stack.pop_back();
            if (!node) continue;
            node->val = v;   // recover the value
            seen.insert(v);
            stack.push_back({node->left, 2 * v + 1});
            stack.push_back({node->right, 2 * v + 2});
        }
    }

    bool find(int target) {
        return seen.count(target);
    }
};
// @test
    FindElements a(H::mkTree({-1, NUL, -1}));
    H::check(vector<bool>{a.find(1), a.find(2)}, vector<bool>{false, true}, "FindElements a");
    FindElements b(H::mkTree({-1, -1, -1, -1, -1}));
    H::check(vector<bool>{b.find(1), b.find(3), b.find(5)}, vector<bool>{true, true, false}, "FindElements b");
    FindElements c(H::mkTree({-1, NUL, -1, -1, NUL, -1}));
    H::check(vector<bool>{c.find(2), c.find(3), c.find(4), c.find(5)}, vector<bool>{true, false, false, true}, "FindElements c");
