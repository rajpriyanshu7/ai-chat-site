import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project/authToken are picked up from SENTRY_ORG, SENTRY_PROJECT,
  // and SENTRY_AUTH_TOKEN when the owner creates the Sentry project. Until
  // then the build plugin skips sourcemap upload and the SDKs stay dormant.
  // No build-time telemetry leaves the site either.
  telemetry: false,
});
