// State object starts empty - everything comes from DB
export const state = {
    items: [],
    categories: [],
    rooms: [],
    totalBudget: 0,
    currentSpending: 0,
    totalEstimated: 0
};

// Proxied Elements to avoid null errors on different pages
export const elements = new Proxy({}, {
    get: function(target, prop) {
        return document.getElementById(prop);
    }
});