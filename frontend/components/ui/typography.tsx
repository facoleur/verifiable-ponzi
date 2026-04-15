import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ElementType } from "react";

// Base typography component with polymorphic 'as' prop
type TypographyProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

function Typography<T extends ElementType = "span">({
  as,
  className,
  children,
  ...props
}: TypographyProps<T>) {
  const Component = as || "span";
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

// Label Components (for form labels, captions, small UI text)
export function LabelXs({ className, ...props }: TypographyProps<"span">) {
  return (
    <Typography
      as="span"
      className={cn("text-10 text-left", className)}
      {...props}
    />
  );
}

export function LabelSm({ className, ...props }: TypographyProps<"span">) {
  return (
    <Typography
      as="span"
      className={cn("text-12 text-left", className)}
      {...props}
    />
  );
}

export function LabelMd({ className, ...props }: TypographyProps<"span">) {
  return (
    <Typography
      as="span"
      className={cn("text-14 text-left", className)}
      {...props}
    />
  );
}

export function LabelLg({ className, ...props }: TypographyProps<"span">) {
  return (
    <Typography
      as="span"
      className={cn("text-16 text-left", className)}
      {...props}
    />
  );
}

// Body Components (for paragraphs, content text)
export function BodyXs({
  className,
  as = "p",
  ...props
}: TypographyProps<"p">) {
  return (
    <Typography
      as={as}
      className={cn("text-12 leading-4", className)}
      {...props}
    />
  );
}

export function BodySm({
  className,
  as = "p",
  ...props
}: TypographyProps<"p">) {
  return <Typography as={as} className={cn("text-14", className)} {...props} />;
}

export function BodyMd({
  className,
  as = "p",
  ...props
}: TypographyProps<"p">) {
  return <Typography as={as} className={cn("text-16", className)} {...props} />;
}

export function BodyLg({
  className,
  as = "p",
  ...props
}: TypographyProps<"p">) {
  return <Typography as={as} className={cn("text-20", className)} {...props} />;
}

// Title Components (for headings, section titles)
export function TitleSm({
  className,
  as = "h3",
  ...props
}: TypographyProps<"h3">) {
  return <Typography as={as} className={cn("text-20", className)} {...props} />;
}

export function TitleMd({
  className,
  as = "h2",
  ...props
}: TypographyProps<"h2">) {
  return <Typography as={as} className={cn("text-24", className)} {...props} />;
}

export function TitleLg({
  className,
  as = "h1",
  ...props
}: TypographyProps<"h1">) {
  return <Typography as={as} className={cn("text-32", className)} {...props} />;
}

// Compound exports for cleaner imports
export const Text = {
  Xs: LabelXs,
  Sm: LabelSm,
  Md: LabelMd,
  Lg: LabelLg,
};

export const Body = {
  Xs: BodyXs,
  Sm: BodySm,
  Md: BodyMd,
  Lg: BodyLg,
};

export const Title = {
  Sm: TitleSm,
  Md: TitleMd,
  Lg: TitleLg,
};
