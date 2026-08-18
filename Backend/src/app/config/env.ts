import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requireEnvVariable = ['NODE_ENV', 'PORT', 'DATABASE_URL'];

  requireEnvVariable.forEach((variable) => {
    if (!process.env[variable]) {
      console.warn(`Environment variable ${variable} is missing in .env file.`);
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string || 'development',
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
  };
};

export const envVars = loadEnvVariables();
