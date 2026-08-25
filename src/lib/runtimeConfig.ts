declare const __COMP_PLANNER_WCA_API_ORIGIN__: string | undefined;
declare const __COMP_PLANNER_WCA_OAUTH_ORIGIN__: string | undefined;
declare const __COMP_PLANNER_WCA_CLIENT_ID__: string | undefined;
declare const __COMP_PLANNER_IS_DEV__: boolean | undefined;

const getDefinedValue = (value: string | undefined) => value || undefined;
const isDevelopment =
  typeof __COMP_PLANNER_IS_DEV__ === 'undefined'
    ? true
    : __COMP_PLANNER_IS_DEV__;

export const WCA_API_ORIGIN =
  getDefinedValue(
    typeof __COMP_PLANNER_WCA_API_ORIGIN__ === 'undefined'
      ? undefined
      : __COMP_PLANNER_WCA_API_ORIGIN__,
  ) ??
  (isDevelopment
    ? 'https://staging.worldcubeassociation.org/api/v0'
    : 'https://api.worldcubeassociation.org');

export const WCA_OAUTH_ORIGIN =
  getDefinedValue(
    typeof __COMP_PLANNER_WCA_OAUTH_ORIGIN__ === 'undefined'
      ? undefined
      : __COMP_PLANNER_WCA_OAUTH_ORIGIN__,
  ) ??
  (isDevelopment
    ? 'https://staging.worldcubeassociation.org'
    : 'https://worldcubeassociation.org');

export const WCA_OAUTH_CLIENT_ID =
  getDefinedValue(
    typeof __COMP_PLANNER_WCA_CLIENT_ID__ === 'undefined'
      ? undefined
      : __COMP_PLANNER_WCA_CLIENT_ID__,
  ) ?? (isDevelopment ? 'example-application-id' : '');
