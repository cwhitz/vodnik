import { useState, useRef } from "react";
import { streamNext, streamBetween, streamModify } from "../services/generationApi";
import type { GeneratedRange, LoreItem, ProviderSettings } from "../types/generation";

export function useGeneration() {
  const [loading, setLoading] = useState(false);
  const [lastGeneratedRange, setLastGeneratedRange] =
    useState<GeneratedRange | null>(null);

  // Track accumulated generated text for range calculation
  const generatedLengthRef = useRef(0);

  const generateNextLine = async ({
    text,
    additionalInstructions,
    wordCount,
    loreItems,
    providerSettings,
    setText,
  }: {
    text: string;
    additionalInstructions: string;
    wordCount: number;
    loreItems?: LoreItem[];
    providerSettings?: ProviderSettings;
    setText: (value: string | ((prev: string) => string)) => void;
  }) => {
    setLoading(true);
    generatedLengthRef.current = 0;
    const startPos = text.length + 1; // +1 for the space we add
    let isFirstChunk = true;

    try {
      await streamNext(
        {
          text,
          additional_instructions: additionalInstructions,
          word_count: wordCount,
          lore: loreItems,
          providerSettings,
        },
        (chunk: string) => {
          // Add a space before the first chunk
          const textToAdd = isFirstChunk ? " " + chunk : chunk;
          isFirstChunk = false;

          generatedLengthRef.current += textToAdd.length;
          setText((prev: string) => prev + textToAdd);
        }
      );

      // Set the final range after streaming completes
      setLastGeneratedRange({
        start: startPos,
        end: startPos + generatedLengthRef.current - 1, // -1 to account for the space
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBetweenText = async ({
    text,
    additionalInstructions,
    wordCount,
    startPos,
    endPos,
    loreItems,
    providerSettings,
    setText,
  }: {
    text: string;
    additionalInstructions: string;
    wordCount: number;
    startPos: number;
    endPos: number;
    loreItems?: LoreItem[];
    providerSettings?: ProviderSettings;
    setText: (value: string) => void;
  }) => {
    setLoading(true);
    generatedLengthRef.current = 0;

    // Keep track of the text before and after the insertion point
    const textBefore = text.slice(0, startPos);
    const textAfter = text.slice(endPos);
    let generatedText = "";

    try {
      await streamBetween(
        {
          text,
          additional_instructions: additionalInstructions,
          word_count: wordCount,
          current_position: startPos,
          lore: loreItems,
          providerSettings,
        },
        (chunk: string) => {
          generatedText += chunk;
          generatedLengthRef.current += chunk.length;
          setText(textBefore + generatedText + textAfter);
        }
      );

      setLastGeneratedRange({
        start: startPos,
        end: startPos + generatedLengthRef.current,
      });
    } finally {
      setLoading(false);
    }
  };

  const undoLastGenerated = (
    setText: (updater: (prev: string) => string) => void
  ) => {
    if (!lastGeneratedRange) return;

    const { start, end, originalText } = lastGeneratedRange;
    if (originalText !== undefined) {
      // Undo a modification: restore the original text
      setText((prev: string) => prev.slice(0, start) + originalText + prev.slice(end));
    } else {
      // Undo an append: remove the generated text
      setText((prev: string) => (prev.slice(0, start) + prev.slice(end)).trimEnd());
    }
  };

  const modifySection = async ({
    text,
    selectedText,
    start,
    end,
    additionalInstructions,
    loreItems,
    providerSettings,
    setText,
  }: {
    text: string;
    selectedText: string;
    start: number;
    end: number;
    additionalInstructions: string;
    loreItems?: LoreItem[];
    providerSettings?: ProviderSettings;
    setText: (value: string | ((prev: string) => string)) => void;
  }) => {
    setLoading(true);
    const textBefore = text.slice(0, start);
    const textAfter = text.slice(end);
    let accumulated = "";

    try {
      await streamModify(
        { selectedText, textBefore, textAfter, additionalInstructions, lore: loreItems, providerSettings },
        (chunk: string) => {
          accumulated += chunk;
          setText(textBefore + accumulated + textAfter);
        }
      );
      setLastGeneratedRange({ start, end: start + accumulated.length, originalText: selectedText });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    lastGeneratedRange,
    generateNextLine,
    generateBetweenText,
    undoLastGenerated,
    modifySection,
  };
}
