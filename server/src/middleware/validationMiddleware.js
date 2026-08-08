const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

// Common validation schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    restaurantName: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const updateCallingSettingsSchema = z.object({
  body: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    timezone: z.string().optional(),
    activeDays: z.array(z.string()).optional(),
    autoFeedbackEnabled: z.boolean().optional(),
  }),
});

const addDncSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(5, 'Phone number is required'),
    reason: z.string().optional(),
  }),
});

const feedbackNotesSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    ownerNotes: z.string().optional(),
  }),
});

const analyzeTranscriptSchema = z.object({
  body: z.object({
    transcript: z.union([z.string(), z.array(z.any())]).optional(),
    text: z.string().optional(),
  }).refine((data) => data.transcript || data.text, {
    message: 'Either transcript or text field is required',
  }),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateCallingSettingsSchema,
  addDncSchema,
  feedbackNotesSchema,
  analyzeTranscriptSchema,
};
