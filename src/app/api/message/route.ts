import { db } from "@/db";
import { googlepalm } from "@/lib/googlepalm";
import { pinecone } from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { GooglePaLMEmbeddings } from "langchain/embeddings/googlepalm";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextRequest } from "next/server";
import { DiscussServiceClient } from "@google-ai/generativelanguage"
import { GoogleAuth } from "google-auth-library"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { openai } from "@/lib/openai";

export const POST = async (req: NextRequest) => {
    // Ask question to pdf file

    const body = await req.json()

    const {getUser} = getKindeServerSession()
    const user = await getUser()

    const {id: userId} = user!

    if(!userId) return new Response('Unauthorized', {status: 401})

    const {fileId, message} = SendMessageValidator.parse(body)

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        }
    })

    if(!file) return new Response('Not found', {status: 404})

    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId
        }
    })

    // vectorizing message


    // Attempt with GooglePaLM

    // const embeddings = new GooglePaLMEmbeddings({
    //     apiKey: process.env.GOOGLE_PALM_API_KEY
    // })

    // const pineconeIndex = pinecone.Index("cogniquill");

    // const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    //     pineconeIndex,
    //     namespace: file.id
    // })

    // const result = await vectorStore.similaritySearch(message, 4)

    // const prevMessage = await db.message.findMany({
    //     where: {
    //         fileId
    //     },
    //     orderBy: {
    //         createdAt: "asc"
    //     },
    //     take: 10
    // })

    // const formattedMessage = prevMessage.map((msg) => ({
    //     role: msg.isUserMessage? "user" as const : "assistant" as const,
    //     content: msg.text
    // }))

    // const messages = [{ content: 'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.' }];
    // const client = new DiscussServiceClient({
    //     authClient: new GoogleAuth().fromAPIKey(process.env.GOOGLE_PALM_API_KEY!),
    // });

    // messages.push({content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
    // \n----------------\n
    
    // PREVIOUS CONVERSATION:
    // ${formattedMessage.map((message) => {
    // //   if (message.role === 'user')
    // //     return `User: ${message.content}\n`
    // //   return `Assistant: ${message.content}\n`
    // return message.content
    // })}
    
    // \n----------------\n
    
    // CONTEXT:
    // ${result.map((r) => r.pageContent).join('\n\n')}
    
    // USER INPUT: ${message}`})

    // const response = await client.generateMessage({
    //     prompt: { messages }
    // });
    // console.log(response)

    // console.log(messages)



    // Attempt with OpenAI

    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })

      const pineconeIndex = pinecone.Index('quill')
    
      const vectorStore = await PineconeStore.fromExistingIndex(
        embeddings,
        {
          pineconeIndex,
          namespace: file.id,
        }
      )
    
      const results = await vectorStore.similaritySearch(
        message,
        4
      )
    
      const prevMessages = await db.message.findMany({
        where: {
          fileId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 6,
      })
    
      const formattedPrevMessages = prevMessages.map((msg) => ({
        role: msg.isUserMessage
          ? ('user' as const)
          : ('assistant' as const),
        content: msg.text,
      }))
    
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
          },
          {
            role: 'user',
            content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
            
      \n----------------\n
      
      PREVIOUS CONVERSATION:
      ${formattedPrevMessages.map((message) => {
        if (message.role === 'user')
          return `User: ${message.content}\n`
        return `Assistant: ${message.content}\n`
      })}
      
      \n----------------\n
      
      CONTEXT:
      ${results.map((r) => r.pageContent).join('\n\n')}
      
      USER INPUT: ${message}`,
          },
        ],
      })

    const stream = OpenAIStream(response, {
        async onCompletion(completion){
            await db.message.create({
                data: {
                    text: completion,
                    isUserMessage: false,
                    fileId,
                    userId
                }
            })
        }
    })

    return new StreamingTextResponse(stream)
}
