import CourseSideBar from "@/components/CourseSideBar";
import MainVideoSummary from "@/components/MainVideoSummary";
import QuizCards from "@/components/QuizCards";
import { prisma } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import React from "react";

type Props = {
  params: {
    slug: string[];
  };
};

const CoursePage = async ({ params: { slug } }: Props) => {
  const [courseId, unitIndexParam, chapterIndexParam] = slug;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          chapters: {
            include: { question: true },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect(`/gallery`);
  }
  let unitIndex = parseInt(unitIndexParam);
  let chapterIndex = parseInt(chapterIndexParam);

  const unit = course.units[unitIndex];
  if (!unit) {
  }

  const chapter = unit.chapters[chapterIndex];
  if (!chapter) {
    return redirect("/gallery");
  }

  // get previous and next chapters
  let prevChapter = unit.chapters[chapterIndex - 1];
  let prevUnitIndex = unitIndex;

  let nextChapter = unit.chapters[chapterIndex + 1];
  let nextUnitIndex = unitIndex;

  if (!prevChapter && unitIndex > 0) {
    const prevUnit = course.units[unitIndex - 1];
    prevChapter = prevUnit.chapters[prevUnit.chapters.length - 1];
    prevUnitIndex -= 1;
  }

  if (!nextChapter && unitIndex < course.units.length - 1) {
    const nextUnit = course.units[unitIndex + 1];
    nextChapter = nextUnit.chapters[0];
    nextUnitIndex += 1;
  }

  return (
    <div>
      <CourseSideBar course={course} currentChapterId={chapter.id} />
      <div className="ml-[25rem] px-8">
        <div className="flex">
          <MainVideoSummary
            chapter={chapter}
            unit={unit}
            chapterIndex={chapterIndex}
            unitIndex={unitIndex}
          />
          <QuizCards chapter={chapter} />
        </div>

        <div className="flex-[1] h-[1px] mt-4 bg-gray-500" />

        <div className="flex pb-8">
          {prevChapter && (
            <Link
              href={`/course/${courseId}/${prevUnitIndex}/${
                prevUnitIndex == unitIndex
                  ? chapterIndex - 1
                  : course.units[prevUnitIndex].chapters.length - 1
              }`}
              className="flex mt-4 mr-auto w-fit"
            >
              <div className="flex items-center">
                <ChevronLeft className="w-6 h-6 mr-1" />
                <div className="flex flex-col items-start">
                  <span className="text-sm text-secondary-foreground/60">
                    Previous
                  </span>
                  <span className="text-xl font-bold">{prevChapter.name}</span>
                </div>
              </div>
            </Link>
          )}

          {nextChapter && (
            <Link
              href={`/course/${courseId}/${nextUnitIndex}/${
                nextUnitIndex == unitIndex ? chapterIndex + 1 : 0
              }`}
              className="flex mt-4 ml-auto w-fit"
            >
              <div className="flex items-center">
                <div className="flex flex-col items-start">
                  <span className="text-sm text-secondary-foreground/60">
                    Next
                  </span>
                  <span className="text-xl font-bold">{nextChapter.name}</span>
                </div>
                <ChevronRight className="w-6 h-6 ml-1" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
