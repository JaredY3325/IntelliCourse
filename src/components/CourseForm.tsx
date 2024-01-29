"use client";
import React, { useState } from "react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { createCourseSchema } from "@/validators/course";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Plus, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {};

type formInput = z.infer<typeof createCourseSchema>;

const CourseForm = (props: Props) => {
  const [submitError, setSubmitError] = useState(" ");

  const form = useForm<formInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: "", units: ["", "", ""] },
  });

  const isLoading = form.formState.isLoading;

  const onSubmit: SubmitHandler<formInput> = async (data) => {
    // TO-DO: Error handling
    console.log(data);
  };

  form.watch();
  console.log(form.watch());

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full mt-4 flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start w-full sm:items-center ">
              <div className="flex items-center w-full ">
                <FormLabel className="flex-[1] text-xl">Title</FormLabel>
                <FormControl className="flex-[6]">
                  <Input
                    placeholder="Enter the main topic of the course"
                    {...field}
                  />
                </FormControl>
              </div>
              <div className="w-full">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <AnimatePresence>
          {form.watch("units").map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                opacity: { duration: 0.2 },
                height: { duration: 0.2 },
              }}
            >
              <FormField
                control={form.control}
                name={`units.${index}`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start w-full sm:items-center ">
                    <div className="flex items-center w-full ">
                      <FormLabel className="flex-[1] text-xl">
                        Unit {index + 1}
                      </FormLabel>
                      <FormControl className="flex-[6]">
                        <Input
                          placeholder="Enter the subtopic of the course"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <div className="w-full">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center justify-center">
          <Separator className="flex-[1]" />
          <div className="mx-4">
            <Button
              type="button"
              variant="secondary"
              className="font-semibold"
              onClick={() => {
                form.setValue("units", [...form.watch("units"), ""]);
              }}
            >
              Add Unit
              <Plus className="w-4 h-4 ml-2 text-green-400" />
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="font-semibold ml-2"
              onClick={() => {
                form.setValue("units", [...form.watch("units").slice(0, -1)]);
              }}
            >
              Remove Unit
              <Trash className="w-4 h-4 ml-2 text-red-400" />
            </Button>
          </div>
          <Separator className="flex-[1]" />
        </div>

        <Button type="submit" className="w-full mt-6" size="lg">
          Generate Course
        </Button>
      </form>
    </Form>
  );
};

export default CourseForm;
