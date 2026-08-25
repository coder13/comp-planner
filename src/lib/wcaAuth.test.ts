import {
  clearWcaAccessToken,
  consumeWcaCallback,
  createWcaLoginUrl,
  getWcaAccessToken,
  saveWcaAccessToken,
} from './wcaAuth';

describe('wcaAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('creates a staging implicit login URL', () => {
    const url = new URL(createWcaLoginUrl());

    expect(url.origin).toBe('https://staging.worldcubeassociation.org');
    expect(url.pathname).toBe('/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('example-application-id');
    expect(url.searchParams.get('response_type')).toBe('token');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost/callback',
    );
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('stores and clears an access token', () => {
    saveWcaAccessToken('token', Date.now() + 60_000);
    expect(getWcaAccessToken()).toBe('token');

    clearWcaAccessToken();
    expect(getWcaAccessToken()).toBeNull();
  });

  it('consumes the OAuth callback and removes the hash', () => {
    const loginUrl = new URL(createWcaLoginUrl());
    window.history.replaceState(null, '', '/callback');
    window.location.hash = `#access_token=callback-token&expires_in=3600&state=${loginUrl.searchParams.get('state')}`;

    expect(consumeWcaCallback()).toBe('callback-token');
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/');
    expect(getWcaAccessToken()).toBe('callback-token');
  });

  it('rejects authorization-code callbacks in the browser', () => {
    window.history.replaceState(null, '', '/callback?code=one-time-code');

    expect(() => consumeWcaCallback()).toThrow(
      'Configure the WCA application to use the browser token flow.',
    );
  });
});
