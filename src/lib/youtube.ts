import axios from "axios";
import { YoutubeTranscript } from "youtube-transcript";
import { strict_output } from "./gpt";

export async function searchYoutube(searchQuery: string) {
  // converts hello world => hello+world
  searchQuery = encodeURIComponent(searchQuery);
  const { data } =
    await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&key=${process.env.YOUTUBE_API_KEY}&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5
  `);

  if (!data || data.items[0] == undefined) {
    console.log("Failed to find a youtube video");
    return null;
  }

  return data.items[0].id.videoId;
}

export async function getTranscript(videoId: string) {
  try {
    let transcript_arr = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
      country: "US",
    });

    // ensure transcript is a single continuous block of text without line breaks
    let transcript = "";
    for (let t of transcript_arr) {
      transcript += t.text + " ";
    }

    return transcript.replaceAll("\n", "");
  } catch (error) {
    return "'";
  }
}

export async function getQuestionsFromTranscript(
  transcript: string,
  course_title: string
) {
  type Question = {
    question: string;
    answer: string;
    option1: string;
    option2: string;
    option3: string;
  };

  const questions: Question[] = await strict_output(
    `As an advanced AI, your primary task is to craft educational multiple-choice questions (MCQs) based on specific content. Each question you generate should be designed to test understanding and retention of the material. For every question, provide four answer choices (A, B, C, and D), ensuring that each answer is succinct and does not exceed 25 words. Your goal is to create questions that are insightful, challenging,  directly relevant and reflect the diversity/breadth of the content provided. `,
    new Array(5).fill(
      `Generate a medium to hard multiple-choice question focused on the key concepts, facts, or insights from the provided transcript related to '${course_title}'. Each question should be unique, thought-provoking, and designed to assess a deep understanding of the material. Include four answer options, ensuring one correct answer and three plausible distractors to challenge th e learner's comprehension. Keep each answer concise, under 25 words, and relevant to the content discussed in the following transcript: ${transcript}. The output must be in valid JSON format.`
    ),
    {
      question: "question",
      answer: "answer with max length of 25 words",
      option1: "option1 with max length of 25 words",
      option2: "option2 with max length of 25 words",
      option3: "option3 with max length of 25 words",
    },
    true
  );

  return questions;
}
