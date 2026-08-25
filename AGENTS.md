# Comp Planner project instructions

## Component structure

- Put every reusable UI component in `src/components/`.
- Give each component its own folder.
- Put the component file, test file, and Storybook story in that folder.
- Use the same component name for all three files.
- Add a Storybook story when you add or change a component.
- Use small, focused components. Keep data access in `src/lib/`.

## Checks

Run these commands before you hand off a change:

```sh
yarn check:type
yarn lint
yarn format:check
yarn test
yarn test:integration
yarn build
yarn build-storybook
```

## Data sources

The app reads public competition data from the WCA API. It uses the Photon
OpenStreetMap geocoder to turn a city name into coordinates. Keep the date,
radius or geographic scope, sort order, grouping, and event count rules in
`src/lib/planner.ts` so that the UI and tests use the same rules. Keep WCA
competition caching in `src/lib/api.ts`; use the cache before starting another
paginated API sweep.
