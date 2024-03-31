"use client";
import { cn } from "@/lib/utils";
import { Chapter, Question } from "@prisma/client";
import React from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";

type Props = {
  chapter: Chapter & {
    question: Question[];
  };
};

const QuizCards = ({ chapter }: Props) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [questionState, setQuestionState] = React.useState<
    Record<string, boolean | null>
  >({});
  console.log(answers, questionState);

  const checkAnswers = React.useCallback(() => {
    const newQuestionState = { ...questionState };
    chapter.question.forEach((question) => {
      const user_answer = answers[question.id];

      if (!user_answer) return null;
      if (user_answer === question.answer) {
        newQuestionState[question.id] = true;
      } else {
        newQuestionState[question.id] = false;
      }

      setQuestionState(newQuestionState);
    });
  }, [answers, questionState, chapter.question]);

  return (
    <div className="flex-[1] mt-16 ml-8">
      <h1 className="text-2xl font-bold">Concept Check</h1>
      <div className="mt-2">
        {chapter.question.map((question) => {
          const options = JSON.parse(question.options) as string[];
          return (
            <div
              key={question.id}
              className={cn(
                `p-3 mt-4 border border-secondary rounded-lg`,
                { "bg-green-700": questionState[question.id] === true },
                { "bg-red-700": questionState[question.id] === false },
                { "bg-secondary-700": questionState[question.id] === null }
              )}
            >
              <h1 className="text-lg font-semibold">{question.question}</h1>
              <div className="mt-2">
                <RadioGroup
                  onValueChange={(e) => {
                    setAnswers((prev) => {
                      return {
                        ...prev,
                        [question.id]: e,
                      };
                    });
                  }}
                >
                  {options.map((option, index) => {
                    return (
                      <div className="flex items-center space-x-2" key={index}>
                        <RadioGroupItem
                          value={option}
                          id={question.id + index.toString()}
                        />
                        <Label htmlFor={question.id + index.toString()}>
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          );
        })}
      </div>
      <Button className="w-full mt-2" size="lg" onClick={checkAnswers}>
        Check Answers
        <ChevronRight />
      </Button>
    </div>
  );
};

export default QuizCards;
