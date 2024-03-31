// api/chapter/getInfo
import { prisma } from "@/lib/db";
import { strict_output } from "@/lib/gpt";
import {
  getQuestionsFromTranscript,
  getTranscript,
  searchYoutube,
} from "@/lib/youtube";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodyParser = z.object({
  chapterId: z.string(),
});

export async function POST(req: Request, res: Response) {
  // TODO: Control the rate in which requests are sent to not exceed the rate limit

  try {
    const body = await req.json();
    const { chapterId } = bodyParser.parse(body); // Validates the parsed body against the zod schema
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 }
      );
    }

    const videoId = await searchYoutube(chapter.youtubeSearchQuery);
    let transcript = await getTranscript(videoId);
    const maxLength = 600;
    transcript = transcript.split(" ").slice(0, maxLength).join(" ");

    // generating summary
    const summary = await strict_output(
      `You are an AI specialized in summarizing educational content`,
      `Produce a concise summary focusing exclusively on the key educational points discussed in the transcript. The summary should be 250 words or less. Exclude any mention of sponsors, advertisements, or any content not directly related to the main educational topic. Do not preface the summary with an introduction about what it is about; begin directly with the substantive content.\n Also make sure the generated output is in valid JSON format` +
        transcript,
      { summary: `summary of the transcript` },
      false
    );

    // generating questions
    const questions = await getQuestionsFromTranscript(
      transcript,
      chapter.name
    );

    // filter out questions that are null or undefined due to unpredictable api errors
    const validQuestions = questions.filter(
      (question) =>
        question.question != null &&
        question.answer != null &&
        question.option1 != null &&
        question.option2 != null &&
        question.option3 != null
    );

    // populate question schema with generated questions
    await prisma.question.createMany({
      data: validQuestions.map((question) => {
        let options = [
          question.answer,
          question.option1,
          question.option2,
          question.option3,
        ];

        options = options.sort(() => Math.random() - 0.5);

        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(options),
          chapterId: chapter.id,
        };
      }),
    });

    // update chapter schema with video and summary
    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        videoId: videoId,
        summary: summary?.summary ?? "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Body",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "unknown",
        },
        { status: 500 }
      );
    }
  }
}
