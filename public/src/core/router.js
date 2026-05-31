const routes = {};

export function registerRoute(name, renderFunction) {
    routes[name] = renderFunction;
}

export function navigate(name, ...args) {
    if (routes[name]) {
        routes[name](...args);
    } else {
        console.error(`Route ${name} not found`);
    }
}
