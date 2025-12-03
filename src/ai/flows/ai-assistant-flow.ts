
'use server';

/**
 * @fileOverview A flow that powers the AI assistant chat.
 *
 * - askAIAssistant - A function that gets a response from the AI assistant.
 * - AskAIAssistantInput - The input type for the askAIAssistant function.
 * - AskAIAssistantOutput - The return type for the askAIAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskAIAssistantInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
});

export type AskAIAssistantInput = z.infer<typeof AskAIAssistantInputSchema>;

const AskAIAssistantOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response."),
});

export type AskAIAssistantOutput = z.infer<typeof AskAIAssistantOutputSchema>;

export async function askAIAssistant(input: AskAIAssistantInput): Promise<AskAIAssistantOutput> {
  return aiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: { schema: AskAIAssistantInputSchema },
  output: { schema: AskAIAssistantOutputSchema },
  prompt: `You are a friendly and helpful AI assistant for a student marketplace app called Campus Cart. Your name is Carty.

  Keep your responses concise and helpful.

  Here is the conversation history:
  {{#each history}}
  - {{role}}: {{content}}
  {{/each}}
  
  Based on the history, provide a relevant and helpful response.`,
});

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AskAIAssistantInputSchema,
    outputSchema: AskAIAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
