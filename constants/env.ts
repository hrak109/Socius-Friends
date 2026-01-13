// Environment configuration for the Socius Mobile app
// This file allows switching between development, staging, and production environments

// Default to production, can be overridden by build-time or runtime config
const ENV = process.env.EXPO_PUBLIC_ENV || 'production';

interface EnvironmentConfig {
    API_URL: string;
    ENV_NAME: string;
    DEBUG: boolean;
}

const environments: Record<string, EnvironmentConfig> = {
    development: {
        API_URL: 'https://api.oakhillpines.com/api/socius',
        ENV_NAME: 'Development',
        DEBUG: true,
    },
    staging: {
        API_URL: 'https://staging-api.oakhillpines.com/api/socius',
        ENV_NAME: 'Staging',
        DEBUG: true,
    },
    production: {
        API_URL: 'https://api.oakhillpines.com/api/socius',
        ENV_NAME: 'Production',
        DEBUG: false,
    },
};

// Export the current environment configuration
const config: EnvironmentConfig = environments[ENV] || environments.production;

export const API_URL = config.API_URL;
export const ENV_NAME = config.ENV_NAME;
export const DEBUG = config.DEBUG;

export default config;
