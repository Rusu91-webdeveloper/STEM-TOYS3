import { z } from "zod";

/**
 * Validates form data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param formData The form data to validate
 * @returns An object containing validation result and any errors
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const data = schema.parse(formData);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Transform Zod errors into a more user-friendly format
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const path = err.path.join(".");
          errors[path] = err.message;
        }
      });
      return { success: false, errors };
    }
    // For unexpected errors, return a generic error message
    return { success: false, errors: { _form: "Form validation failed" } };
  }
}

/**
 * Creates a form validator with methods for validating the entire form or individual fields
 */
export function createFormValidator(schema: z.ZodSchema) {
  return {
    /**
     * Validates the entire form
     * @param formData The form data to validate
     */
    validateForm: (formData: unknown) => {
      return validateFormData(schema, formData);
    },

    /**
     * Validates a single field by creating a partial schema
     * @param field The field name to validate
     * @param value The field value
     */
    validateField: (field: string, value: unknown): string | undefined => {
      try {
        // For object schemas, we can try to validate just the specified field
        if (schema instanceof z.ZodObject) {
          const partialSchema = schema.pick({ [field]: true });
          partialSchema.parse({ [field]: value });
          return undefined;
        }

        // For array or other schema types, validate the whole value
        schema.parse(value);
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors[0]; // Get the first error
          return fieldError?.message;
        }
        return "Validation failed";
      }
    },
  };
}
