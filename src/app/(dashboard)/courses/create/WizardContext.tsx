"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CourseGenerationSchema } from "@/server/schema/course";
import { z } from "zod";
import { ReactNode } from "react";

export function WizardProvider({ children }: { children: ReactNode }) {
  type FormInput = z.input<typeof CourseGenerationSchema>;
  
  const methods = useForm<FormInput>({
    resolver: zodResolver(CourseGenerationSchema),
    defaultValues: {
      topic: "",
      level: "Beginner",
      hoursPerDay: 2,
      deadlineDate: undefined,
      isPublic: true,
    },
    mode: "onChange",
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}
