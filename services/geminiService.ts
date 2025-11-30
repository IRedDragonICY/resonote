import { GoogleGenAI, Tool, Type, Part } from "@google/genai";
import { ABCResult, ValidationResult } from "../types";
import { SYSTEM_INSTRUCTION } from "./prompts";

// Define the tool for the model
const validateABCTool: Tool = {
  functionDeclarations: [
    {
      name: 'validate_abc_notation',
      description: 'Validates the syntax of the generated ABC notation using the abcjs engine. Call this to check for errors before finishing.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          abc_notation: {
            type: Type.STRING,
            description: 'The full ABC notation string to validate.',
          },
        },
        required: ['abc_notation'],
      },
    }
  ],
};

export const convertImageToABC = async (
  files: File[], 
  model: string,
  onLog: (message: string, type?: 'info' | 'success' | 'warning' | 'thinking') => void,
  onStreamUpdate: (text: string) => void,
  validatorFn: (abc: string) => ValidationResult
): Promise<ABCResult> => {

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 1. Image Processing
    const parts = await Promise.all(
      files.map(async (file, index) => {
        try {
            const base64Data = await fileToGenerativePart(file);
            return {
            inlineData: {
                data: base64Data,
                mimeType: file.type
            }
            };
        } catch (e: any) {
            throw new Error(`Failed to process image ${file.name}: ${e.message}`);
        }
      })
    );

    // Configure Thinking based on Model Family
    // Thinking Config is ONLY available for Gemini 2.5 series. Do not use for Gemini 3.
    let thinkingConfig = undefined;
    
    if (model.includes('2.5')) {
        thinkingConfig = {
            includeThoughts: true,
            thinkingBudget: model.includes('flash') ? 24576 : 32768
        };
    }

    // Initialize Chat
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [validateABCTool],
        thinkingConfig: thinkingConfig
      },
    });

    onLog(`Scanning image for musical structures...`, 'thinking');

    // Initial Message parts
    let currentMessageParts: Part[] = [
        ...parts,
        { text: "Transcribe this sheet music to ABC notation (Standard 2.1). Be extremely precise with pitch, rhythm, and lyric alignment. Ensure strict syntax compliance." }
    ];

    let fullText = "";
    let finalAbc = "";
    let turnCount = 0;
    const MAX_TURNS = 8; // Increased max turns to allow for corrections

    while (turnCount < MAX_TURNS) {
        onLog(`Turn ${turnCount + 1}: Refining transcription...`, 'info');
        
        const result = await chat.sendMessageStream({ message: currentMessageParts });
        
        let toolCall: any = null;
        let thoughtAccumulator = "";

        for await (const chunk of result) {
            const candidates = chunk.candidates;
            // Robust check to prevent "parts is not iterable"
            if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
                const parts = candidates[0].content.parts;
                
                for (const part of parts) {
                    // 1. Handle Native Thoughts
                    if (part.thought) {
                        if (part.text) {
                            thoughtAccumulator += part.text;
                            onLog(thoughtAccumulator, 'thinking');
                        }
                        continue;
                    }

                    // 2. Handle Text Content
                    if (part.text) {
                        fullText += part.text;
                        
                        // Extract and stream only the ABC part
                        const codeMatch = fullText.match(/(X:[\s\S]*)/);
                        if (codeMatch) {
                            onStreamUpdate(cleanAbc(codeMatch[1]));
                        } else {
                            if (fullText.includes("X:") || fullText.length > 50) {
                                onStreamUpdate(cleanAbc(fullText));
                            }
                        }
                    }

                    // 3. Handle Tool Calls
                    if (part.functionCall) {
                        toolCall = part.functionCall;
                    }
                }
            }
        }

        // If the model produced a tool call
        if (toolCall) {
            const functionName = toolCall.name;
            const args = toolCall.args;
            
            onLog(`Verifying syntax...`, 'info');

            if (functionName === 'validate_abc_notation') {
                const abcToValidate = args.abc_notation;
                
                if (abcToValidate) {
                    onStreamUpdate(cleanAbc(abcToValidate));
                }

                const validationResult = validatorFn(abcToValidate);

                let toolResponseContent = {};
                
                if (validationResult.isValid) {
                    onLog("Syntax valid. Performing visual fidelity check...", 'success');
                    toolResponseContent = {
                        result: "Syntax is VALID according to abcjs parser. \n\nFINAL CHECK: \n1. Do the lyrics align perfectly with the notes?\n2. Are multi-measure rests (Z) used correctly?\n3. Are there any prohibited directives like %%measure?\nIf perfect, output the ABC code."
                    };
                } else {
                    onLog(`Found ${validationResult.errors.length} syntax errors. correcting...`, 'warning');
                    toolResponseContent = {
                        result: `CRITICAL SYNTAX ERRORS DETECTED (ABCJS PARSER):\n${validationResult.errors.join('\n')}\n\nREFER TO THE ABC STANDARD 2.1 RULES IN SYSTEM INSTRUCTION. Fix these errors immediately.`
                    };
                }

                currentMessageParts = [
                    {
                        functionResponse: {
                            name: functionName,
                            id: toolCall.id,
                            response: toolResponseContent
                        }
                    }
                ];
            }
        } else {
            const potentialAbc = cleanAbc(fullText);
            if (potentialAbc.includes("X:")) {
                // Final validation before breaking
                const finalValidation = validatorFn(potentialAbc);
                if (!finalValidation.isValid) {
                    onLog(`Final output has errors. Forcing correction...`, 'warning');
                    currentMessageParts = [{ text: `Your final output still has syntax errors: ${finalValidation.errors.join(', ')}. You must fix them to comply with ABC Standard 2.1.` }];
                } else {
                    finalAbc = potentialAbc;
                    onLog("Transcription Finalized.", 'success');
                    break; 
                }
            } else {
                currentMessageParts = [{ text: "Please generate the final ABC notation code block now." }];
            }
        }

        turnCount++;
        fullText = "";
    }

    if (turnCount >= MAX_TURNS) {
        onLog("Optimization complete (Max turns reached).", 'warning');
        finalAbc = cleanAbc(fullText);
    }

    return {
      abc: finalAbc,
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    onLog(`Error: ${error.message || "Unknown error occurred"}`, 'warning');
    throw error;
  }
};

function cleanAbc(text: string): string {
    if (!text) return "";
    const match = text.match(/X:[\s\S]*/);
    if (match) {
        return match[0].replace(/```abc\s*/g, '').replace(/```$/g, '').trim();
    }
    return text.replace(/^```abc\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
}

async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.error) {
        reject(reader.error);
        return;
      }
      
      const res = reader.result as string;
      if (!res) {
        reject(new Error("Failed to read file: result is empty"));
        return;
      }

      try {
        const parts = res.split(',');
        if (parts.length < 2) {
             reject(new Error("Invalid Data URL format"));
             return;
        }
        const base64String = parts[1];
        resolve(base64String);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => {
        reject(reader.error || new Error("Unknown FileReader error"));
    };
    reader.readAsDataURL(file);
  });
}