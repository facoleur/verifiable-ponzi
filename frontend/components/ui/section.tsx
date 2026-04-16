"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

function Section({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-xl bg-slate-300/45 backdrop-blur-xl", className)}
      {...props}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  className,
  bordered = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { bordered?: boolean }) {
  return (
    <div
      className={cn(
        "px-5 py-4",
        bordered && "border-b border-slate-300/70",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-sm font-medium text-slate-800", className)} {...props}>
      {children}
    </div>
  );
}

function SectionDescription({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-xs text-slate-500", className)} {...props}>
      {children}
    </div>
  );
}

function SectionContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export { Section, SectionContent, SectionDescription, SectionHeader, SectionTitle };
