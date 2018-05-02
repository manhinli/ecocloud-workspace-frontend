// little wrapper around keycloak client.
// the problem is, that the keycloak client object stores state on itself.
// which means, that it is a mutable object and should not be stored in the
// redux state tree.
import axios from 'axios';
import * as actions from '../actions';

// TODO: NEXT: create a little helper, to manage axios instances
//       with custom interceptors....
//       One to manage login (public client) and token exchange to other clients
//       Another to talk to local/workpsace client
//       Another etc.....

// TODO: ideally we'd include external keycloak.js like this, but I can't
//       get webpack and eslint to pass or properly compile it.
// import * as Keycloak from './keycloak';
// export const keycloak = Keycloak('/keycloak.json');
export const keycloak = window.Keycloak('/keycloak.json');

// TODO: starting with Keycloak 4 we'll get a real Promise back.
//       for now wrap in real Promise
function wrapKeycloakPromise(kcpromise) {
  return new Promise((resolve, reject) => {
    kcpromise
      .success(result => resolve(result))
      .error(result => reject(result));
  });
}

export function initAuth(store) {
  // TODO: do a retry / backoff loop here ... until keycloak init succeeds (no error)
  //       or if moved into an init saga, do it there.

  // setup token refresh
  keycloak.onTokenExpired = () => wrapKeycloakPromise(keycloak.updateToken())
    .then(refreshed => console.log('refresh on expire:', refreshed))
    .catch(error => console.log('refresh on expire failed'));

  // init keycloak
  return wrapKeycloakPromise(keycloak.init({ onLoad: 'check-sso' }))
    .then(x => x && store.dispatch(actions.loginSucceeded(keycloak)))
    .catch(e => console.log('E KC:', e));
}


// TODO: there may be a migration problem between keycloak 3 and 4. It looks
//       like to scope to exchange tokens has been renamed from token-exchange (3)
//       to exchange'to (4) ... all permission / policies in ketcloak need to be updated
//       old scopes can be removed / cleaned up?
// TODO: file an issue with keycloak team about error 500 in keycloak 4 with token exchange...
//       maybe this token rename is the problem and should never have happened?

// A methods to retrieve a token for a different client (token exchange) from
// keycloak
// returns a promise
function fetchClientToken(clientid) {
  // 1. make sure our access token is valid:
  return wrapKeycloakPromise(keycloak.updateToken())
    // 2. exchange current token for client access token
    .then(() => {
      // token should be up to date, buld token exchange request
      // using URLSearchParams instructs axios to set content type correctly as well
      const params = new URLSearchParams();
      params.append('client_id', keycloak.clientId);
      params.append('grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange');
      params.append('subject_token', keycloak.token);
      params.append('subject_issuer', keycloak.tokenParsed.iss);
      params.append('subject_token_type', 'urn:ietf:params:oauth:token-type:access_token');
      params.append('requested_token_type', 'urn:ietf:params:oauth:token-type:access_token');
      // refresh_token, id_token
      params.append('audience', clientid);
      return axios.post(
        // TODO: change in Keycloak 4
        // keycloak.endpoints.token(),
        'https://auth.ecocloud.org.au/auth/realms/test/protocol/openid-connect/token',
        params,
        // {
        //   headers: {
        //     Authorization: `Bearer ${keycloak.token}`,
        //   },
        // },
      );
    })
    // 3. return token response
    .then(response => response.data);
}

// Storage cache for client tokens.
//    keys... client ids, values .. tokens
const tokenCache = {};
// methods:
//    add client token
//      maybe set up expiry callback
//    get client token
//      what if expired?... get a new one automatically?


export function getClientToken(clientid) {
  // returns a promise which resolves to access token
  // check store for valid token
  if (tokenCache[clientid]) {
    const { validUntil, response } = tokenCache[clientid];
    // we have some info for this clientid ... still valid?
    if ((new Date().getTime() / 1000) < validUntil) {
      // entry still valid ... return it
      return Promise.resolve(response.access_token);
    }
  }
  // we are still here, no valid token yet.
  // fetch a new token from token endpoint
  return fetchClientToken(clientid)
    .then((response) => {
      // we have a new token response, store it in cache
      const validUntil = ((new Date().getTime() / 1000) + response.expires_in) - keycloak.timeSkew;
      tokenCache[clientid] = {
        validUntil,
        response,
      };
      // return new token
      return response.access_token;
    });
}


// init keycloak

// events:
//    onReady(authenticated)
//    onAuthSuccess
//    onAuthError
//    onAuthRefreshSuccess
//    onAuthRefreshError
//    onAuthLogout
//    onTokenExpired