// api/course/creatChapters endpoint

import { prisma } from "@/lib/db";
import { strict_output } from "@/lib/gpt";
import { getUnspalshImage } from "@/lib/unsplash";
import { createCourseSchema } from "@/validators/course";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type outputUnits = {
  title: string;
  chapters: { youtube_search_query: string; chapter_title: string }[];
}[];

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();
    const { title, units } = createCourseSchema.parse(body);

    let output_units: outputUnits = await strict_output(
      "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter",
      units.map(
        (unit, index) =>
          `It is your job to create a course about ${title}, specifically for unit of ${unit}. The user has requested to create chapters for each of the units. Then, for each chapter, provide a detailed youtube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course on YouTube. The generated response must be in valid JSON format. The output for each unit should look like this:`
      ),
      {
        title: "title of the unit",
        chapters:
          "an array of chapters, each chapter should have a youtube_search_query and a chapter_title key in the JSON object",
      },
      true
    );

    output_units = Array.isArray(output_units) ? output_units : [output_units];

    const imageSearchTerm = await strict_output(
      "you are an AI capable of finding the most relevant image for a course",
      `Please provide a good image search term for the title of a course about ${title}. This search term will be fed into the unsplash API, so make sure it is a good search term that will return good results. Ensure the output is in valid JSON format.`,
      {
        image_search_term: "a good search term for the title of the course",
      },
      false
    );

    const course_image = await getUnspalshImage(
      imageSearchTerm.image_search_term
    );

    const course = await prisma.course.create({
      data: {
        name: title,
        image: course_image,
      },
    });

    for (const unit of output_units) {
      const title = unit.title;
      const prismaUnit = await prisma.unit.create({
        data: {
          name: title,
          courseId: course.id,
        },
      });

      await prisma.chapter.createMany({
        data: unit.chapters.map((chapter) => {
          return {
            name: chapter.chapter_title,
            youtubeSearchQuery: chapter.youtube_search_query,
            unitId: prismaUnit.id,
          };
        }),
      });
    }

    return NextResponse.json({ course_id: course.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse("Invalid body", { status: 400 });
    } else {
      console.log(error);
    }
  }
}

export async function GET() {}
