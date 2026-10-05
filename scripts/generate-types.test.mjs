import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTypesFromOpenApi } from './generate-types.mjs';

test('DEV-01: Schema-driven TypeScript generator produces types dynamically from OpenAPI', () => {
  const mockSpec = {
    openapi: '3.1.0',
    components: {
      schemas: {
        TestModel: {
          type: 'object',
          required: ['id', 'count'],
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            count: { type: 'integer' },
            tags: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['pending', 'active', 'archived'] },
            meta: { type: 'object', additionalProperties: true },
          },
        },
        RepresentationResponse: {
          type: 'object',
          required: ['representation'],
          properties: {
            representation: { type: 'string' },
          },
        },
      },
    },
    paths: {},
  };

  const tsOutput1 = generateTypesFromOpenApi(mockSpec);
  assert.equal(tsOutput1.includes('export interface TestModel'), true);
  assert.equal(tsOutput1.includes('id: string;'), true);
  assert.equal(tsOutput1.includes('count: number;'), true);
  assert.equal(tsOutput1.includes('tags?: string[];'), true);
  assert.equal(tsOutput1.includes('status?: "pending" | "active" | "archived";'), true);
  assert.equal(tsOutput1.includes('meta?: Record<string, unknown>;'), true);
  assert.equal(tsOutput1.includes('representation: string;'), true);

  // Now mutate the schema fixture: add a new property and change representation to array of strings
  const modifiedSpec = JSON.parse(JSON.stringify(mockSpec));
  modifiedSpec.components.schemas.TestModel.properties.new_field = { type: 'boolean' };
  modifiedSpec.components.schemas.TestModel.required.push('new_field');
  modifiedSpec.components.schemas.RepresentationResponse.properties.representation = {
    type: 'array',
    items: { type: 'string' },
  };

  const tsOutput2 = generateTypesFromOpenApi(modifiedSpec);
  assert.equal(tsOutput2.includes('new_field: boolean;'), true);
  assert.equal(tsOutput2.includes('representation: string[];'), true);

  // Confirm that tsOutput1 does not have the changes, proving output is schema-driven
  assert.equal(tsOutput1.includes('new_field: boolean;'), false);
  assert.notEqual(tsOutput1, tsOutput2);
});
