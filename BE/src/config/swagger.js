const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FieldNow API',
      version: '1.0.0',
      description:
        'FieldNow — Football field booking platform API. Manage fields, slots, bookings, and payments.',
      contact: {
        name: 'FieldNow Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login',
        },
      },
      schemas: {
        // --- Reusable response envelopes ---
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid request payload' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },

        // --- Auth schemas ---
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'mypassword123' },
            fullName: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['USER', 'OWNER'], default: 'USER' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@fieldnow.dev' },
            password: { type: 'string', example: 'password123' },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'User registered successfully' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['USER', 'OWNER'] },
                  },
                },
              },
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                refreshToken: { type: 'string', example: 'b1f2e6c3...' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['USER', 'OWNER', 'ADMIN'] },
                    full_name: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
        MeResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['USER', 'OWNER', 'ADMIN'] },
                    iat: { type: 'integer', description: 'Token issued at (unix timestamp)' },
                    exp: { type: 'integer', description: 'Token expires at (unix timestamp)' },
                  },
                },
              },
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'b1f2e6c3...' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '+84901234567' },
            avatarUrl: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
          },
        },
        // --- Field & Slot schemas ---
        CreateFieldRequest: {
          type: 'object',
          required: ['name', 'location', 'pricePerHour'],
          properties: {
            name: { type: 'string', example: 'Central Stadium' },
            location: { type: 'string', example: '123 Main St, HCMC' },
            description: { type: 'string', example: 'Premium 7-a-side football field' },
            images: { type: 'array', items: { type: 'string', format: 'uri' }, example: ['https://example.com/field1.jpg'] },
            pricePerHour: { type: 'number', example: 500000 },
            type: { type: 'string', enum: ['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'] },
          },
        },
        UpdateFieldRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Central Stadium Updated' },
            location: { type: 'string', example: '456 Main St, HCMC' },
            description: { type: 'string', example: 'Updated description' },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            pricePerHour: { type: 'number', example: 550000 },
            type: { type: 'string', enum: ['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'] },
          },
        },
        CreateSlotRequest: {
          type: 'object',
          required: ['date', 'startTime', 'endTime'],
          properties: {
            date: { type: 'string', format: 'date', example: '2026-10-10' },
            startTime: { type: 'string', example: '18:00' },
            endTime: { type: 'string', example: '19:00' },
            priceOverride: { type: 'number', nullable: true, example: 600000 },
          },
        },
        BatchCreateSlotsRequest: {
          type: 'object',
          required: ['slots'],
          properties: {
            slots: {
              type: 'array',
              items: { $ref: '#/components/schemas/CreateSlotRequest' },
            },
          },
        },
        UpdateSlotRequest: {
          type: 'object',
          properties: {
            startTime: { type: 'string', example: '18:30' },
            endTime: { type: 'string', example: '19:30' },
            priceOverride: { type: 'number', nullable: true, example: null },
            isLocked: { type: 'boolean', example: true },
          },
        },
        // --- Booking schemas ---
        CreateBookingRequest: {
          type: 'object',
          required: ['slotId'],
          properties: {
            slotId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            slot_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
            expires_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        // --- Payment schemas ---
        InitiatePaymentRequest: {
          type: 'object',
          required: ['bookingId'],
          properties: {
            bookingId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            booking_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 500000 },
            provider: { type: 'string', example: 'vnpay' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'] },
            provider_ref: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        // --- Admin schemas ---
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'OWNER', 'ADMIN'] },
            phone: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        UpdateUserRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['USER', 'OWNER', 'ADMIN'] },
          },
        },
        UploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                urls: {
                  type: 'array',
                  items: { type: 'string', format: 'uri' },
                  example: ['https://project.supabase.co/storage/v1/object/public/field-images/fields/1/123.jpg'],
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
