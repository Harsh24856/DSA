int squareDigits(int x) {
    int s = 0;
    for (; x; x /= 10) s += (x % 10) * (x % 10);
    return s;
}

// Floyd: slow moves one step, fast two; they meet on the cycle, or fast reaches 1
bool isHappy(int n) {
    int slow = n, fast = squareDigits(n);
    while (fast != 1 && slow != fast) {
        slow = squareDigits(slow);
        fast = squareDigits(squareDigits(fast));
    }
    return fast == 1;
}
// @test
    H::check(isHappy(19), true, "19 is happy");
    H::check(isHappy(2), false, "2 cycles");
    H::check(isHappy(1), true, "1");
    H::check(isHappy(7), true, "7 is happy");
