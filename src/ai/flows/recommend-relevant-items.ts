'use server';

/**
 * @fileOverview A flow that recommends relevant items to a student based on their browsing and purchase history.
 *
 * - recommendRelevantItems - A function that recommends relevant items.
 * - RecommendRelevantItemsInput - The input type for the recommendRelevantItems function.
 * - RecommendRelevantItemsOutput - The return type for the recommendRelevantItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendRelevantItemsInputSchema = z.object({
  userHistory: z.string().describe('The user browsing and purchase history.'),
  availableItems: z.string().describe('The list of available items for sale.'),
});
export type RecommendRelevantItemsInput = z.infer<typeof RecommendRelevantItemsInputSchema>;

const RecommendRelevantItemsOutputSchema = z.object({
  recommendedItems: z.string().describe('The list of recommended items.'),
});
export type RecommendRelevantItemsOutput = z.infer<typeof RecommendRelevantItemsOutputSchema>;

export async function recommendRelevantItems(input: RecommendRelevantItemsInput): Promise<RecommendRelevantItemsOutput> {
  return recommendRelevantItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendRelevantItemsPrompt',
  input: {schema: RecommendRelevantItemsInputSchema},
  output: {schema: RecommendRelevantItemsOutputSchema},
  prompt: `You are a recommendation system that recommends items to students based on their past browsing and purchase history.

  User History: {{{userHistory}}}
  Available Items: {{{availableItems}}}

  Recommend items that the student might be interested in. Return the recommended items in a list.
  `,
});

const recommendRelevantItemsFlow = ai.defineFlow(
  {
    name: 'recommendRelevantItemsFlow',
    inputSchema: RecommendRelevantItemsInputSchema,
    outputSchema: RecommendRelevantItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
