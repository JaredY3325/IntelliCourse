"use client";
import { cn } from "@/lib/utils";
import { Chapter, Course, Unit } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { Separator } from "./ui/separator";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
};

const CourseSideBar = ({ course, currentChapterId }: Props) => {
  const [sidebarWidth, setSidebarWidth] = React.useState(25); // Initial sidebar width
  const [isResizing, setIsResizing] = React.useState(false);

  // Start resizing
  const startResizing = React.useCallback(
    (mouseDownEvent: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setIsResizing(true);
      let startX = mouseDownEvent.clientX;
      let startWidth = sidebarWidth;

      const onMouseMove = (mouseMoveEvent: MouseEvent) => {
        const diffX = mouseMoveEvent.clientX - startX;
        const diffRem = diffX / 16;
        const newWidth = startWidth + diffRem;
        setSidebarWidth(Math.max(9, newWidth)); // Minimum width of ~150px
      };

      function onMouseUp() {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth]
  );

  return (
    <div
      className="absolute mt-5 p-6 rounded-r-3xl bg-secondary"
      style={{ width: `${sidebarWidth}rem` }}
    >
      <h1 className="text-4xl font-bold">{course.name}</h1>
      {course.units.map((unit, unitIndex) => {
        return (
          <div key={unit.id} className="mt-4">
            <h2 className="text-sm uppercase text-secondary-foreground/60">
              Unit {unitIndex + 1}
            </h2>
            <h2 className="text-2xl font-bold">{unit.name}</h2>
            {unit.chapters.map((chapter, chapterIndex) => {
              return (
                <div key={chapter.id}>
                  <Link
                    href={`/course/${course.id}/${unitIndex}/${chapterIndex}`}
                    className={cn(`text-secondary-foreground/60`, {
                      "text-green-500 font-bold":
                        chapter.id == currentChapterId,
                    })}
                  >
                    {chapter.name}
                  </Link>
                </div>
              );
            })}
            <Separator className="mt-2 bg-gray-500" />
          </div>
        );
      })}

      <div
        onMouseDown={startResizing}
        style={{
          cursor: "ew-resize",
          userSelect: "none",
          width: "10px",
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </div>
  );
};

export default CourseSideBar;
