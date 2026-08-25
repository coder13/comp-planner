import { WCA_OAUTH_CLIENT_ID, WCA_OAUTH_ORIGIN } from './runtimeConfig';

const ACCESS_TOKEN_KEY = 'comp-planner:wca-access-token';
const EXPIRATION_KEY = 'comp-planner:wca-access-token-expires-at';
const STATE_KEY = 'comp-planner:wca-oauth-state';

export const isWcaAuthConfigured = Boolean(WCA_OAUTH_CLIENT_ID);
export const WCA_CALLBACK_PATH = '/callback';

const createState = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getWcaRedirectUri = () =>
  `${window.location.origin}${WCA_CALLBACK_PATH}`;

export const createWcaLoginUrl = () => {
  if (!WCA_OAUTH_CLIENT_ID) {
    throw new Error('WCA login is not configured for this deployment.');
  }

  const state = createState();
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: WCA_OAUTH_CLIENT_ID,
    redirect_uri: getWcaRedirectUri(),
    response_type: 'token',
    scope: 'public',
    state,
  });

  return `${WCA_OAUTH_ORIGIN}/oauth/authorize?${params.toString()}`;
};

export const startWcaLogin = () => {
  window.location.assign(createWcaLoginUrl());
};

export const saveWcaAccessToken = (accessToken: string, expiresAt: number) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(EXPIRATION_KEY, String(expiresAt));
};

export const clearWcaAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(EXPIRATION_KEY);
};

export const getWcaAccessToken = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRATION_KEY));

  if (!accessToken || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearWcaAccessToken();
    return null;
  }

  return accessToken;
};

export const consumeWcaCallback = () => {
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.has('code')) {
    throw new Error(
      'WCA returned an authorization code. Configure the WCA application to use the browser token flow.',
    );
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) {
    return null;
  }

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const returnedState = params.get('state');
  sessionStorage.removeItem(STATE_KEY);
  if (expectedState && expectedState !== returnedState) {
    throw new Error('The WCA login state did not match.');
  }

  const expiresIn = Number(params.get('expires_in') ?? 0);
  const expiresAt = Date.now() + Math.max(expiresIn, 1) * 1000;
  saveWcaAccessToken(accessToken, expiresAt);
  window.history.replaceState(null, '', '/');

  return accessToken;
};
