"use client";
import { cn } from "@/lib/utils";
import { Chapter } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

// Defines the props type for the ChapterCard component
type Props = {
  chapter: Chapter;
  chapterIndex: number;
  completedChapters: Set<String>;
  setCompletedChapters: React.Dispatch<React.SetStateAction<Set<String>>>;
};

// Defines the handler type for methods exposed to parent components
export type ChapterCardHandler = {
  triggerLoad: () => void;
};

// The ChapterCard component displays information about a chapter and manages its load state
const ChapterCard = React.forwardRef<ChapterCardHandler, Props>(
  ({ chapter, chapterIndex, completedChapters, setCompletedChapters }, ref) => {
    const { toast } = useToast();
    const [success, setSuccess] = useState<boolean | null>(null);

    // handles asynchronous data fetching for chapter information
    const { mutate: getChapterInfo, isPending } = useMutation({
      mutationFn: async () => {
        const response = await axios.post("/api/chapter/getInfo", {
          chapterId: chapter.id,
        });
        return response.data;
      },
    });

    // Memoized callback to add the current chapter's ID to the set of completed chapters
    const addChapterIdToSet = React.useCallback(() => {
      setCompletedChapters((prev) => {
        const newSet = new Set(prev);
        newSet.add(chapter.id);
        return newSet;
      });
    }, [chapter.id, setCompletedChapters]);

    // Effect to automatically mark the chapter as completed if videoId is present
    React.useEffect(() => {
      if (chapter.videoId) {
        setSuccess(true);
        addChapterIdToSet();
      }
    }, [chapter, addChapterIdToSet]);

    // Exposes the triggerLoad method to parent components via ref
    React.useImperativeHandle(ref, () => ({
      async triggerLoad() {
        // if videoId is generated, mark chapter as completed
        if (chapter.videoId) {
          addChapterIdToSet();
          return;
        }

        getChapterInfo(undefined, {
          onSuccess: () => {
            setSuccess(true);
            addChapterIdToSet();
          },
          onError: (error) => {
            console.error(error);
            setSuccess(false);
            toast({
              title: "Error",
              description: "Thre was an error loading your chapters",
              variant: "destructive",
            });
            addChapterIdToSet();
          },
        });
      },
    }));

    return (
      // Renders the chapter card with conditional styling based on load success or failure
      <div
        key={chapter.id}
        className={cn("px-4 py-2 mt-2 rounded flex justify-between", {
          "bg-secondary": success === null,
          "bg-red-500": success === false,
          "bg-green-500": success === true,
        })}
      >
        <h5>
          {chapterIndex + 1} {chapter.name}
        </h5>
        {isPending && <Loader2 className="animate-spin" />}
      </div>
    );
  }
);

ChapterCard.displayName = "ChapterCard";

export default ChapterCard;
