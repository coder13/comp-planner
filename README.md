# Comp Planner

Comp Planner helps organizers choose events for a new WCA competition.

The first tool finds competitions near a city. Choose an as-of date and a
radius in miles, or search the entire selected state. For cities in Alaska,
Washington, and Oregon, you can also search the Pacific Northwest.

The app lists each event by its most recent nearby competition and counts how
many times the event was held in the previous 12 months.

Enable upcoming competitions to include public WCA competition records for the
next 12 months. Future competitions appear in a separate list. They do not
change the event history counts or the last-held dates.

Results start as one row per event and are sorted from least recently held to
most recently held. Use the view switch to group events under their latest
competition instead.

The search reads the previous 24 months of competition history. This lookback
keeps the result fast while it gives the event list useful recent context.

## Run the app

Install the packages:

```sh
yarn install
```

Start the development server:

```sh
yarn dev
```

Start Storybook to preview the components:

```sh
yarn storybook
```

The app reads competition data from the public WCA API. It uses the Photon
OpenStreetMap geocoder to turn a city name into coordinates. Normalized WCA
competition results are cached in memory and in local storage for 24 hours,
and concurrent searches reuse the same request.

## WCA login

Local development uses the WCA staging site and its example OAuth application.
The login lists your upcoming and ongoing competitions. Select one to compare
its events with nearby event history and get suggestions.

For production, set these build variables:

- `VITE_WCA_API_ORIGIN`
- `VITE_WCA_OAUTH_ORIGIN`
- `VITE_WCA_CLIENT_ID`

Set the WCA OAuth callback URL to `https://comp-planner.netlify.app/callback`.
The app uses the browser token flow, so the WCA login request must return a
token in the URL hash. A code flow needs a server secret and does not work in
this Vite client.
