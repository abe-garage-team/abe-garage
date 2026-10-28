const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contracts = JSON.parse(fs.readFileSync(path.join(root, 'docs/api/contracts.json'), 'utf8'));

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Abe Garage API',
    version: '1.0.0',
    description: 'Authoritative machine-readable OpenAPI specification for the Abe Garage platform',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local development server',
    },
  ],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      SetupKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Setup-Key',
      },
    },
  },
};

for (const ep of contracts.endpoints) {
  const pathKey = ep.path.startsWith('/api') ? ep.path.slice(4) : ep.path;
  openapi.paths[pathKey] = openapi.paths[pathKey] || {};
  const method = ep.method.toLowerCase();

  const operation = {
    tags: [ep.task_id.split('-')[0]],
    summary: `${ep.task_id} - ${ep.method} ${ep.path}`,
    description: `Owned by ${ep.owner}. Priority: ${ep.priority}. Access: ${ep.access}.`,
    responses: {
      [ep.success_status]: {
        description: ep.response?.message || 'Success',
        content: {
          'application/json': {
            example: ep.response,
          },
        },
      },
      400: { description: 'Validation failed / Invalid input' },
      401: { description: 'Missing, invalid, expired or revoked access token' },
      403: { description: 'Inactive account or insufficient role' },
      500: { description: 'Unexpected server error' },
    },
  };

  if (ep.request) {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          example: ep.request,
        },
      },
    };
  }

  if (ep.access !== 'Public') {
    if (ep.path === '/api/install') {
      operation.security = [{ SetupKey: [] }];
    } else {
      operation.security = [{ BearerAuth: [] }];
    }
  }

  openapi.paths[pathKey][method] = operation;
}

fs.writeFileSync(path.join(root, 'docs/api/openapi.json'), JSON.stringify(openapi, null, 2));
console.log('Generated docs/api/openapi.json from contracts.json successfully.');
