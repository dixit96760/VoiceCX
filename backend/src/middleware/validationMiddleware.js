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

const createFeedbackSchema = z.object({
  body: z.object({
    rating: z.number({ required_error: 'Rating is required' }).min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    summary: z.string().optional(),
    text: z.string().optional(),
    transcript: z.any().optional(),
    customerPhone: z.string().optional(),
    phone: z.string().optional(),
    customerName: z.string().optional(),
    name: z.string().optional(),
    customer: z.string().optional(),
    customerId: z.string().optional(),
    status: z.enum(['pending', 'reviewed', 'resolved', 'action_required']).optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    categoryRatings: z.object({
      food: z.number().optional(),
      service: z.number().optional(),
      ambience: z.number().optional(),
      value: z.number().optional(),
    }).optional(),
    ownerNotes: z.string().optional(),
    notes: z.string().optional(),
    topIssues: z.array(z.string()).optional(),
    complaints: z.array(z.string()).optional(),
    praises: z.array(z.string()).optional(),
  }).refine((data) => {
    const textContent = data.text || data.summary || (typeof data.transcript === 'string' ? data.transcript : (Array.isArray(data.transcript) && data.transcript.length > 0 ? JSON.stringify(data.transcript) : ''));
    return Boolean(textContent && textContent.trim().length > 0);
  }, {
    message: 'Feedback text cannot be empty',
    path: ['text'],
  }),
});

const updateFeedbackSchema = z.object({
  body: z.object({
    rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').optional(),
    summary: z.string().optional(),
    text: z.string().optional(),
    transcript: z.any().optional(),
    customerPhone: z.string().optional(),
    phone: z.string().optional(),
    customerName: z.string().optional(),
    name: z.string().optional(),
    customer: z.string().optional(),
    customerId: z.string().optional(),
    status: z.enum(['pending', 'reviewed', 'resolved', 'action_required']).optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    categoryRatings: z.object({
      food: z.number().optional(),
      service: z.number().optional(),
      ambience: z.number().optional(),
      value: z.number().optional(),
    }).optional(),
    ownerNotes: z.string().optional(),
    notes: z.string().optional(),
    topIssues: z.array(z.string()).optional(),
    complaints: z.array(z.string()).optional(),
    praises: z.array(z.string()).optional(),
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
  createFeedbackSchema,
  updateFeedbackSchema,
  analyzeTranscriptSchema,
};
