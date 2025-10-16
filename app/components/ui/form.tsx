import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  props: ControllerProps<TFieldValues, TName>
) => <Controller {...props} />;

const FormItemContext = React.createContext<{ id: string } | undefined>(
  undefined
);
const useFormItemContext = () => {
  const context = React.useContext(FormItemContext);
  if (!context) {
    throw new Error("FormItem components must be used within <FormItem>");
  }
  return context;
};

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} ref={ref} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { id } = useFormItemContext();
  return (
    <LabelPrimitive.Root
      className={cn("font-medium text-sm", className)}
      htmlFor={id}
      ref={ref}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { id } = useFormItemContext();
  return <Slot id={id} ref={ref} {...props} />;
});
FormControl.displayName = "FormControl";

const FormMessage = ({
  className,
  children,
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  const { id } = useFormItemContext();
  const form = useFormContext();
  const fieldState = form.getFieldState(id as never, form.formState);
  if (!(children || fieldState.error)) return null;
  return (
    <p
      className={cn("font-medium text-destructive text-sm", className)}
      role="alert"
    >
      {children ?? fieldState.error?.message}
    </p>
  );
};

const FormDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
);

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
};
