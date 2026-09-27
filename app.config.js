// Extends app.json. On EAS Build, the Firebase config files come from
// EAS file environment variables (they are gitignored, so EAS can't upload them).
// Locally, the paths from app.json (./config/firebase/...) are used.
module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICE_INFO_PLIST ?? config.ios?.googleServicesFile,
  },
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
});
