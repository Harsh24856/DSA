// Test harness for the C++ solutions (lib/solutions/cpp/*.cpp). Each solution is compiled with this header in front, so
// it can use LeetCode's ListNode and TreeNode exactly as on the site. lib/solutions/cpp_test.py writes the main().
#pragma once
#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <deque>
#include <functional>
#include <iostream>
#include <list>
#include <map>
#include <numeric>
#include <optional>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

namespace H {
// NUL stands for null in level-order tree lists: mkTree({1, NUL, 2}).
constexpr int NUL = INT_MIN;

inline ListNode* mkList(const vector<int>& a) {
    ListNode dummy, *c = &dummy;
    for (int v : a) { c->next = new ListNode(v); c = c->next; }
    return dummy.next;
}
inline vector<int> listVec(ListNode* h) { vector<int> out; for (; h; h = h->next) out.push_back(h->val); return out; }

inline TreeNode* mkTree(const vector<int>& a) {            // LeetCode level order
    if (a.empty() || a[0] == NUL) return nullptr;
    TreeNode* root = new TreeNode(a[0]);
    queue<TreeNode*> q; q.push(root);
    for (size_t i = 1; i < a.size(); ) {
        TreeNode* n = q.front(); q.pop();
        if (i < a.size() && a[i] != NUL) { n->left = new TreeNode(a[i]); q.push(n->left); } i++;
        if (i < a.size() && a[i] != NUL) { n->right = new TreeNode(a[i]); q.push(n->right); } i++;
    }
    return root;
}
inline vector<int> levelVec(TreeNode* r) {                 // back to level order, trailing nulls dropped
    vector<int> out; queue<TreeNode*> q; q.push(r);
    while (!q.empty()) { TreeNode* n = q.front(); q.pop(); if (n) { out.push_back(n->val); q.push(n->left); q.push(n->right); } else out.push_back(NUL); }
    while (!out.empty() && out.back() == NUL) out.pop_back();
    return out;
}
inline void inorderInto(TreeNode* r, vector<int>& out) { if (!r) return; inorderInto(r->left, out); out.push_back(r->val); inorderInto(r->right, out); }
inline vector<int> inorderVec(TreeNode* r) { vector<int> out; inorderInto(r, out); return out; }
inline int height(TreeNode* r) { return r ? 1 + max(height(r->left), height(r->right)) : 0; }
inline bool balanced(TreeNode* r) { return !r || (abs(height(r->left) - height(r->right)) <= 1 && balanced(r->left) && balanced(r->right)); }
inline TreeNode* find(TreeNode* r, int v) { if (!r) return nullptr; if (r->val == v) return r; TreeNode* l = find(r->left, v); return l ? l : find(r->right, v); }

// printing, for failure messages
inline void show(ostream& o, const string& s) { o << '"' << s << '"'; }
inline void show(ostream& o, char c) { o << '\'' << c << '\''; }
inline void show(ostream& o, bool b) { o << (b ? "true" : "false"); }
template <class T> auto show(ostream& o, const T& v) -> decltype(o << v, void()) { o << v; }
template <class A, class B> void show(ostream& o, const pair<A, B>& p) { o << '('; show(o, p.first); o << ", "; show(o, p.second); o << ')'; }
template <class T> void show(ostream& o, const vector<T>& v) { o << '['; for (size_t i = 0; i < v.size(); i++) { if (i) o << ", "; show(o, v[i]); } o << ']'; }
template <class T> string str(const T& v) { ostringstream o; show(o, v); return o.str(); }

inline int passed = 0, failed = 0;
template <class A, class B> void check(const A& got, const B& expected, const string& name) {
    if (got == expected) passed++;
    else { failed++; cout << "FAIL " << name << "\n  got      " << str(got) << "\n  expected " << str(expected) << "\n"; }
}
inline void checkNear(double got, double expected, const string& name) {
    if (fabs(got - expected) < 1e-5) passed++;
    else { failed++; cout << "FAIL " << name << "\n  got      " << got << "\n  expected " << expected << "\n"; }
}
template <class T> vector<T> sorted(vector<T> v) { sort(v.begin(), v.end()); return v; }
inline int report() { cout << "RESULT " << passed << " " << failed << "\n"; return failed ? 1 : 0; }
}  // namespace H
using H::NUL;
