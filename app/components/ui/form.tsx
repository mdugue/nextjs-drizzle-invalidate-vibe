import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  type ControllerProps,
  type FieldValues,
  FormProvider,
  useFormContext,
  type FieldPath,
} from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: ControllerProps<TFieldValues, TName>,
) => {
  return <Controller {...props} />;
};

const FormItemContext = React.createContext<{ id: string } | undefined>(undefined);
const useFormItemContext = () => {
  const context = React.useContext(FormItemContext);
  if (!context) {
    throw new Error("FormItem components must be used within <FormItem>");
  }
  return context;
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { id } = useFormItemContext();
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-sm font-medium", className)}
      htmlFor={id}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { id } = useFormItemContext();
    return <Slot ref={ref} id={id} {...props} />;
  },
);
FormControl.displayName = "FormControl";

const FormMessage = ({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) => {
  const { id } = useFormItemContext();
  const form = useFormContext();
  const fieldState = form.getFieldState(id as never, form.formState);
  if (!children && !fieldState.error) return null;
  return (
    <p className={cn("text-sm font-medium text-destructive", className)} role="alert">
      {children ?? fieldState.error?.message}
    </p>
  );
};

const FormDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription };
