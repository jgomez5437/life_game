let auth0Client = null;

const config = {
    domain: "dev-ofc1agu3ax7gzj2f.us.auth0.com",
    clientId: "SzIrZaBzHZLS9js0HtJEwA35ZwN8hmkT"
};

async function configureAuth() {
    auth0Client = await auth0Client.createAuth0Client({
        domain: config.domain,
        clientId: config.clientId,
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });

    


}