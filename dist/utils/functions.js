"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.colorFromString = colorFromString;
exports.generateOrderSlug = generateOrderSlug;
exports.isWithinBudget = isWithinBudget;
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function colorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h},50%,40%)`;
}
function generateOrderSlug() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let slug = '';
    for (let i = 0; i < 8; i++) {
        slug += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return slug;
}
;
function isWithinBudget(budgetString, price) {
    console.log(budgetString, price);
    if (!budgetString || typeof price !== "number")
        return false;
    // Remove currency symbols and spaces
    const clean = budgetString.replace(/[^\d,.-]/g, "");
    console.log({ clean });
    // Check if it's a range or single value
    if (clean.includes("-")) {
        const [min, max] = clean.split("-").map(v => parseInt(v.replace(/,/g, ""), 10));
        if (isNaN(min) || isNaN(max))
            return false;
        return price >= min && price <= max;
    }
    console.log("here");
    // Single budget value (treat as max budget)
    const max = parseInt(clean.replace(/,/g, ""), 10);
    console.log({ max });
    if (isNaN(max))
        return false;
    return price <= max;
}
//# sourceMappingURL=functions.js.map