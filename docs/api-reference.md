# API Reference

## Overview

The Ministry Platform provides a comprehensive REST API for managing forms, users, analytics, and system administration. All API endpoints require authentication unless otherwise specified.

## Base URL

```
Production: https://tawasal.moct.gov.sy/api
Development: http://localhost:3000/api
```

## Authentication

### Bearer Token

Most endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "role": "super_admin",
    "ministryId": null
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

API endpoints are rate-limited per user:

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **File upload endpoints**: 20 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "name": "string",
    "role": "string",
    "ministryId": "string"
  }
}
```

#### POST /api/auth/logout
Logout user and invalidate token.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### POST /api/auth/refresh
Refresh JWT token.

**Response:**
```json
{
  "token": "string"
}
```

### Forms

#### GET /api/forms
Get all forms accessible to the user.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (draft, published, archived)
- `ministryId` (string): Filter by ministry ID

**Response:**
```json
{
  "forms": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "createdBy": "string",
      "ministryId": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### POST /api/forms
Create a new form.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "components": [
    {
      "id": "string",
      "type": "string",
      "label": "string",
      "required": "boolean",
      "options": ["string"]
    }
  ],
  "settings": {
    "theme": "string",
    "layout": "string"
  }
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "draft",
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### GET /api/forms/:id
Get a specific form by ID.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "components": [
    {
      "id": "string",
      "type": "string",
      "label": "string",
      "required": "boolean",
      "options": ["string"]
    }
  ],
  "settings": {
    "theme": "string",
    "layout": "string"
  },
  "status": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### PUT /api/forms/:id
Update a form.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "components": [
    {
      "id": "string",
      "type": "string",
      "label": "string",
      "required": "boolean",
      "options": ["string"]
    }
  ],
  "settings": {
    "theme": "string",
    "layout": "string"
  }
}
```

#### DELETE /api/forms/:id
Delete a form.

**Response:**
```json
{
  "message": "Form deleted successfully"
}
```

#### POST /api/forms/:id/publish
Publish a form.

**Response:**
```json
{
  "message": "Form published successfully",
  "publishedAt": "string"
}
```

#### POST /api/forms/:id/unpublish
Unpublish a form.

**Response:**
```json
{
  "message": "Form unpublished successfully"
}
```

#### POST /api/forms/:id/submit
Submit form data.

**Request Body:**
```json
{
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Response:**
```json
{
  "submissionId": "string",
  "message": "Form submitted successfully",
  "submittedAt": "string"
}
```

#### GET /api/forms/:id/submissions
Get form submissions.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `dateFrom` (string): Start date (ISO 8601)
- `dateTo` (string): End date (ISO 8601)

**Response:**
```json
{
  "submissions": [
    {
      "id": "string",
      "formId": "string",
      "data": "object",
      "submittedAt": "string",
      "submittedBy": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Users

#### GET /api/users
Get all users (admin only).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `ministryId` (string): Filter by ministry ID
- `role` (string): Filter by role

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "username": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "ministryId": "string",
      "isActive": "boolean",
      "createdAt": "string",
      "lastLogin": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### POST /api/users
Create a new user (admin only).

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "ministryId": "string"
}
```

#### GET /api/users/:id
Get a specific user.

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "ministryId": "string",
  "isActive": "boolean",
  "createdAt": "string",
  "lastLogin": "string"
}
```

#### PUT /api/users/:id
Update a user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "ministryId": "string",
  "isActive": "boolean"
}
```

#### DELETE /api/users/:id
Delete a user.

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### Analytics

#### GET /api/analytics/overview
Get analytics overview.

**Response:**
```json
{
  "totalForms": "number",
  "totalSubmissions": "number",
  "activeUsers": "number",
  "submissionsToday": "number",
  "submissionsThisWeek": "number",
  "submissionsThisMonth": "number",
  "topForms": [
    {
      "formId": "string",
      "title": "string",
      "submissions": "number"
    }
  ]
}
```

#### GET /api/analytics/forms
Get form analytics.

**Query Parameters:**
- `formId` (string): Specific form ID
- `dateFrom` (string): Start date
- `dateTo` (string): End date
- `granularity` (string): hour, day, week, month

**Response:**
```json
{
  "formId": "string",
  "title": "string",
  "submissions": "number",
  "views": "number",
  "completionRate": "number",
  "averageTime": "number",
  "timeline": [
    {
      "date": "string",
      "submissions": "number",
      "views": "number"
    }
  ]
}
```

#### GET /api/analytics/users
Get user analytics.

**Response:**
```json
{
  "totalUsers": "number",
  "activeUsers": "number",
  "newUsers": "number",
  "userActivity": [
    {
      "date": "string",
      "activeUsers": "number",
      "newUsers": "number"
    }
  ]
}
```

### Reports

#### GET /api/reports
Get all reports.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Report type
- `status` (string): Report status

**Response:**
```json
{
  "reports": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "string",
      "status": "string",
      "createdAt": "string",
      "createdBy": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### POST /api/reports
Create a new report.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "type": "string",
  "config": {
    "dateRange": "string",
    "filters": "object",
    "format": "string"
  }
}
```

#### GET /api/reports/:id
Get a specific report.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "config": "object",
  "status": "string",
  "data": "object",
  "createdAt": "string",
  "generatedAt": "string"
}
```

#### POST /api/reports/:id/generate
Generate report data.

**Response:**
```json
{
  "message": "Report generated successfully",
  "generatedAt": "string"
}
```

#### GET /api/reports/:id/download
Download report file.

**Response:**
File download (PDF, Excel, CSV)

### Health

#### GET /api/health
Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "string",
  "uptime": "number",
  "version": "string",
  "environment": "string",
  "services": {
    "database": "string",
    "redis": "string",
    "memory": "object",
    "disk": "object"
  }
}
```

#### GET /api/health/db
Get database health status.

**Response:**
```json
{
  "status": "connected",
  "timestamp": "string",
  "message": "string"
}
```

#### GET /api/health/redis
Get Redis health status.

**Response:**
```json
{
  "status": "connected",
  "timestamp": "string",
  "message": "string"
}
```

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = function() {
  console.log('Connected to WebSocket');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Events

#### Real-time Analytics
```json
{
  "type": "analytics_update",
  "data": {
    "formId": "string",
    "submissions": "number",
    "views": "number"
  }
}
```

#### Form Submission
```json
{
  "type": "form_submission",
  "data": {
    "formId": "string",
    "submissionId": "string",
    "submittedAt": "string"
  }
}
```

#### System Alerts
```json
{
  "type": "system_alert",
  "data": {
    "level": "warning",
    "message": "string",
    "timestamp": "string"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { MinistryPlatformAPI } from '@ministry-platform/sdk';

const api = new MinistryPlatformAPI({
  baseURL: 'https://tawasal.moct.gov.sy/api',
  token: 'your-jwt-token'
});

// Create a form
const form = await api.forms.create({
  title: 'My Form',
  description: 'A test form',
  components: [
    {
      id: '1',
      type: 'text',
      label: 'Name',
      required: true
    }
  ]
});

// Submit form data
const submission = await api.forms.submit(form.id, {
  data: {
    name: 'John Doe'
  }
});
```

### Python

```python
from ministry_platform import MinistryPlatformAPI

api = MinistryPlatformAPI(
    base_url='https://tawasal.moct.gov.sy/api',
    token='your-jwt-token'
)

# Create a form
form = api.forms.create({
    'title': 'My Form',
    'description': 'A test form',
    'components': [
        {
            'id': '1',
            'type': 'text',
            'label': 'Name',
            'required': True
        }
    ]
})

# Submit form data
submission = api.forms.submit(form['id'], {
    'data': {
        'name': 'John Doe'
    }
})
```

### cURL Examples

#### Create a Form
```bash
curl -X POST https://tawasal.moct.gov.sy/api/forms \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Form",
    "description": "A test form",
    "components": [
      {
        "id": "1",
        "type": "text",
        "label": "Name",
        "required": true
      }
    ]
  }'
```

#### Submit Form Data
```bash
curl -X POST https://tawasal.moct.gov.sy/api/forms/123/submit \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "John Doe"
    }
  }'
```

## Changelog

### Version 1.0.0
- Initial API release
- Form management endpoints
- User management endpoints
- Analytics endpoints
- Report generation endpoints
- Health check endpoints
- WebSocket support for real-time updates
