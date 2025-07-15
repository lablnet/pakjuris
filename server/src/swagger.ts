import { OpenAPIV3 } from 'openapi-types'

const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'PakJuris API',
    version: '1.0.0',
    description: 'Swagger documentation for the PakJuris backend API.'
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Local server'
    }
  ],
  paths: {
    '/api/auth/signup': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email', 'password', 'name']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully'
          },
          '400': {
            description: 'Validation errors'
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in an existing user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/verify-email': {
      post: {
        summary: 'Verify OTP for email',
        responses: {
          '200': { description: 'Email verified' },
          '400': { description: 'Invalid OTP' }
        }
      }
    },
    '/api/auth/resend-otp': {
      post: {
        summary: 'Resend verification OTP',
        responses: {
          '200': { description: 'OTP resent' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout current user',
        responses: {
          '200': { description: 'Logged out' }
        }
      }
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh access token',
        responses: {
          '200': { description: 'Token refreshed' }
        }
      }
    },
    '/api/auth/reset/request': {
      post: {
        summary: 'Request password reset OTP',
        responses: {
          '200': { description: 'OTP sent' }
        }
      }
    },
    '/api/auth/reset/verify': {
      post: {
        summary: 'Verify password reset OTP',
        responses: {
          '200': { description: 'OTP verified' }
        }
      }
    },
    '/api/auth/reset/update': {
      post: {
        summary: 'Update password after verification',
        responses: {
          '200': { description: 'Password updated' }
        }
      }
    },
    '/api/user/me': {
      get: {
        summary: 'Get current user profile',
        responses: {
          '200': { description: 'Profile data' },
          '401': { description: 'Unauthenticated' }
        }
      },
      put: {
        summary: 'Update current user profile',
        responses: {
          '200': { description: 'Profile updated' },
          '400': { description: 'Validation errors' },
          '401': { description: 'Unauthenticated' }
        }
      }
    },
    '/api/chat/query': {
      post: {
        summary: 'Submit a chat prompt',
        responses: {
          '200': { description: 'Chat response stream' },
          '401': { description: 'Unauthenticated' }
        }
      }
    },
    '/api/chat/conversations': {
      get: {
        summary: 'List all conversations',
        responses: { '200': { description: 'Conversation list' } }
      },
      post: {
        summary: 'Create a new conversation',
        responses: { '201': { description: 'Conversation created' } }
      }
    },
    '/api/chat/conversations/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      get: {
        summary: 'Get a conversation by ID',
        responses: { '200': { description: 'Conversation data' } }
      },
      put: {
        summary: 'Update a conversation',
        responses: { '200': { description: 'Conversation updated' } }
      },
      delete: {
        summary: 'Delete a conversation',
        responses: { '204': { description: 'Conversation deleted' } }
      }
    },
    '/api/chat/conversations/{id}/share': {
      post: {
        summary: 'Generate shareable link',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: { '200': { description: 'Share link generated' } }
      }
    },
    '/api/chat/feedback': {
      post: {
        summary: 'Create feedback for a message',
        responses: { '201': { description: 'Feedback created' } }
      }
    },
    '/api/chat/feedback/{messageId}': {
      parameters: [
        {
          name: 'messageId',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      get: {
        summary: 'Retrieve feedback for a message',
        responses: { '200': { description: 'Feedback data' } }
      }
    }
  }
}

export default swaggerDocument; 