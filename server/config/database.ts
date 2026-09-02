import mongoose from "mongoose";

let isConnected = false;

const isServerless = Boolean(
  process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
);

export const connectDatabase = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const customMongoUri = process.env.MONGODB_URI?.trim();

  if (!customMongoUri) {
    if (isServerless) {
      throw new Error("MONGODB_URI is required when deployed on Netlify.");
    }

    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const memoryServerInstance = await MongoMemoryServer.create();
    const inMemoryUri = memoryServerInstance.getUri();
    await mongoose.connect(inMemoryUri);
    console.log("Connected to in-memory MongoDB for local development.");
    isConnected = true;
    return;
  }

  await mongoose.connect(customMongoUri);
  console.log("Connected to MongoDB.");
  isConnected = true;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
};
