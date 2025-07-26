"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCounter = setupCounter;
function setupCounter(element) {
    let counter = 0;
    const setCounter = (count) => {
        counter = count;
        element.innerHTML = `count is ${counter}`;
    };
    element.addEventListener('click', () => setCounter(++counter));
    setCounter(0);
}
//# sourceMappingURL=main.js.map