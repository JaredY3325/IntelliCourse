import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  isList: boolean,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gpt-3.5-turbo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
) {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";
  let allOutputs = []; // Array to hold outputs for each prompt if multiple prompts are provided

  const prompts = Array.isArray(user_prompt) ? user_prompt : [user_prompt];

  for (const individualPrompt of prompts) {
    for (let i = 0; i < num_tries; i++) {
      let output_format_prompt: string = constructOutputFormatPrompt(
        list_output,
        output_format,
        dynamic_elements
      );

      // Adjust system message to include error messages if any
      const systemMessage = `${system_prompt}${output_format_prompt}${error_msg}`;

      const response = await openai.chat.completions.create({
        temperature: temperature,
        model: model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: individualPrompt.toString() },
        ],
        response_format: { type: "json_object" },
      });

      let res: string =
        response.choices[0].message?.content?.replace(/'/g, '"') ?? "";
      res = res.replace(/(\w)"(\w)/g, "$1'$2");

      if (verbose) {
        console.log("System prompt:", systemMessage);
        console.log("\nUser prompt:", individualPrompt);
        console.log("\nGPT response:", res);
      }

      try {
        let output: any = JSON.parse(res);

        if (list_output && isList && !Array.isArray(output)) {
          output = [output];
        }
        console.log(output);

        // Process output verification and modifications here based on your output_format rules

        allOutputs.push(output); // Add output for this prompt to the allOutputs array
        break; // Break from the retry loop on success
      } catch (e) {
        error_msg = `\n\nAttempt ${
          i + 1
        } failed with error: ${e}\nResponse: ${res}`;
        if (i === num_tries - 1) {
          console.error(
            "All attempts failed for prompt:",
            individualPrompt,
            "\nFinal Error:",
            e
          );
          allOutputs.push([]); // Optional: Push an empty array or a placeholder to indicate failure
        }
      }
    }
  }

  return list_input ? allOutputs : allOutputs[0]; // Return all outputs if multiple prompts, otherwise just the first
}

function constructOutputFormatPrompt(
  list_output: boolean,
  output_format: OutputFormat,
  dynamic_elements: boolean
): string {
  let prompt = `\nYou are to output ${
    list_output ? "an array of objects in" : ""
  } the following in json format: ${JSON.stringify(
    output_format
  )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

  if (list_output) {
    prompt += `\nIf output field is a list, classify output into the best element of the list.`;
  }

  if (dynamic_elements) {
    prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it.`;
  }

  return prompt;
}
