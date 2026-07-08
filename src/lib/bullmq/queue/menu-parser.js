import { Queue } from "bullmq";
import { redisConnection } from "../redis.js";

export const menuParserQueue = new Queue("swiggyMenuParserQueue", {
    connection: redisConnection,
});