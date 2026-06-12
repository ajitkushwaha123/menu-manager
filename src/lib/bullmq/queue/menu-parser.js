import Redis from "ioredis";
import dotenv from "dotenv";
import { Queue } from "bullmq";

dotenv.config();
const connection = new Redis(process.env.REDIS_URL);

export const menuParserQueue = new Queue("menuParserQueue", {
    connection,
});