import "../server/_core/loadEnv.js";
import { createApp } from "../server/app.js";

export default createApp({ clientFallback: true });
