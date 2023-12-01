import { GooglePaLM } from "langchain/llms/googlepalm";


export const googlepalm = new GooglePaLM({
    apiKey: process.env.GOOGLE_PALM_API_KEY,
    temperature: 0
})