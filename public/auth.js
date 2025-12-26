let auth0Client = null;

const config = {
    domain: "dev-ofc1agu3ax7gzj2f.us.auth0.com",
    clientId: "SzIrZaBzHZLS9js0HtJEwA35ZwN8hmkT"
};

window.configureAuth = async function() {
    window.auth0Client = await auth0.createAuth0Client({
        domain: config.domain,
        clientId: config.clientId,
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
        await window.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
    }
};

window.login = async function() {
    await window.auth0Client.loginWithRedirect();
};

window.logout = async function() {
    await window.auth0Client.logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    });
};

async function updateAuthUI() {
    const isAuthenticated = await auth0Client.isAuthenticated();
    const loginBtn = document.getElementById("btn-login");
    const logoutBtn = document.getElementById("btn-logout");
    const userDisplay = document.getElementById("header-name");
    if (isAuthenticated) {
        const user = await auth0Client.getUser();
        console.log("Logged in user:", user);
        window.userAuthId = user.sub;
        if (loginBtn) loginBtn.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (userDisplay) userDisplay.innerText = user.nickname || user.email;
    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (userDisplay) userDisplay.innerText = "Guest Player";
    }
};