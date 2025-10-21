import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createStory, getUserStories, getStory, deleteStory } from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { v4 as uuidv4 } from "uuid";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  story: router({
    // Generate story from image
    generateStory: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        imageBase64: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Step 1: Analyze image with GPT-4o Vision
          const imageContent = input.imageBase64 
            ? {
                type: "image_url" as const,
                image_url: {
                  url: `data:image/jpeg;base64,${input.imageBase64}`,
                  detail: "high" as const,
                }
              }
            : {
                type: "image_url" as const,
                image_url: {
                  url: input.imageUrl,
                  detail: "high" as const,
                }
              };

          // Step 2: Use Function Calling to extract story metadata
          const tools = [
            {
              type: "function" as const,
              function: {
                name: "extract_story_elements",
                description: "Extract key story elements from the image",
                parameters: {
                  type: "object" as const,
                  properties: {
                    title: {
                      type: "string",
                      description: "A compelling title for the story",
                    },
                    genre: {
                      type: "string",
                      description: "Genre of the story (e.g., fantasy, mystery, romance, sci-fi)",
                    },
                    mood: {
                      type: "string",
                      description: "The mood or atmosphere (e.g., mysterious, joyful, dark, peaceful)",
                    },
                    characters: {
                      type: "array",
                      items: { type: "string" },
                      description: "Main characters in the story",
                    },
                    setting: {
                      type: "string",
                      description: "The setting or location of the story",
                    },
                    imageDescription: {
                      type: "string",
                      description: "Detailed description of what is in the image",
                    },
                  },
                  required: ["title", "genre", "mood", "characters", "setting", "imageDescription"],
                },
              },
            },
          ];

          const analysisResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a creative storyteller and image analyst. Analyze the provided image and extract key story elements. You must use the extract_story_elements function to structure your analysis.",
              },
              {
                role: "user",
                content: [
                  imageContent as any,
                  {
                    type: "text",
                    text: "Analyze this image and extract story elements. What story could this image inspire? Provide a detailed analysis.",
                  },
                ],
              },
            ],
            tools: tools,
            tool_choice: { type: "function", function: { name: "extract_story_elements" } },
          });

          // Parse the function call response
          let storyElements = {
            title: "Untitled Story",
            genre: "Fiction",
            mood: "Mysterious",
            characters: ["The Protagonist"],
            setting: "An Unknown Place",
            imageDescription: "An intriguing image",
          };

          const toolCall = analysisResponse.choices[0].message.tool_calls?.[0];
          if (toolCall && toolCall.function.name === "extract_story_elements") {
            try {
              storyElements = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              console.error("Failed to parse tool arguments:", e);
            }
          }

          // Step 3: Generate the full story using the extracted elements
          const storyPrompt = `
You are a master storyteller. Based on the following image analysis and story elements, write a compelling and engaging story.

Image Description: ${storyElements.imageDescription}
Title: ${storyElements.title}
Genre: ${storyElements.genre}
Mood: ${storyElements.mood}
Characters: ${storyElements.characters.join(", ")}
Setting: ${storyElements.setting}

Write a complete story (300-500 words) that incorporates these elements. Make it engaging, vivid, and emotionally resonant. The story should feel inspired by the image.
`;

          const storyResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a creative and talented storyteller. Write engaging, vivid stories that captivate the reader.",
              },
              {
                role: "user",
                content: storyPrompt,
              },
            ],
          });

          const story = storyResponse.choices[0].message.content;

          // Step 4: Save to database
          const storyId = uuidv4();
          const savedStory = await createStory({
            id: storyId,
            userId: ctx.user.id,
            imageUrl: input.imageUrl,
            imageDescription: storyElements.imageDescription,
            story: typeof story === "string" ? story : "",
            title: storyElements.title,
            genre: storyElements.genre,
            mood: storyElements.mood,
            characters: JSON.stringify(storyElements.characters),
            setting: storyElements.setting,
          });

          return {
            success: true,
            story: savedStory,
          };
        } catch (error) {
          console.error("Error generating story:", error);
          throw new Error("Failed to generate story");
        }
      }),

    // Get user's stories
    getMyStories: protectedProcedure.query(async ({ ctx }) => {
      const stories = await getUserStories(ctx.user.id);
      return stories;
    }),

    // Get single story
    getStory: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const story = await getStory(input.id);
        return story;
      }),

    // Delete story
    deleteStory: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const story = await getStory(input.id);
        if (!story || story.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        const success = await deleteStory(input.id);
        return { success };
      }),

    // Upload image
    uploadImage: protectedProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.base64, "base64");
          const key = `stories/${Date.now()}-${input.filename}`;
          const { url } = await storagePut(key, buffer, "image/jpeg");
          return { url };
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new Error("Failed to upload image");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

