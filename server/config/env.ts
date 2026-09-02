import dotenv from "dotenv";

dotenv.config();

const isServerless = Boolean(
  process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
);

const failMissingEnv = (variableName: string): never => {
  const message = `Missing required environment variable: ${variableName}`;
  if (isServerless) {
    throw new Error(message);
  }
  console.error(message);
  process.exit(1);
};

const requireEnv = (variableName: string): string => {
  const value = process.env[variableName]?.trim();
  if (!value) {
    failMissingEnv(variableName);
  }
  return value;
};

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const DEFAULT_MEMBER_PASSWORD = requireEnv("DEFAULT_MEMBER_PASSWORD");
export const CLIENT_URL =
  process.env.CLIENT_URL?.trim() ||
  process.env.URL?.trim() ||
  process.env.DEPLOY_PRIME_URL?.trim() ||
  "http://localhost:5173";
export const SERVER_PORT = Number(process.env.PORT) || 5173;
