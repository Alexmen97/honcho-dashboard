import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_SNAPSHOT_PATH = path.join(ROOT_DIR, 'docs/openapi-3.2.2.json');
const DEFAULT_TARGET_PATH = path.join(ROOT_DIR, 'src/types/api.ts');

/**
 * Pragmatic Schema-Driven TypeScript Code Generator
 *
 * Scope & Design Boundaries:
 * - Specifically tailored for Honcho OpenAPI 3.2.2 components.schemas and dialectic $defs.
 * - Resolves primitive types (string, number, boolean), enums, arrays, unions (anyOf), and $ref references.
 * - Known Boundaries & Trade-offs:
 *   1. Inline anonymous object schemas without an explicit $ref resolve to `Record<string, unknown>`.
 *   2. `DialecticResponse` and `DialecticStreamChunk` are explicit client-side envelope interfaces
 *      that wrap the schema-generated `Evidence` ($defs) and SSE streaming chunk deltas.
 * - This generator does not claim universal arbitrary OpenAPI 3.1 poly-tree AST compiler fidelity
 *   for every possible exotic JSON Schema edge-case, but guarantees reproducible, deterministic
 *   typed contracts from docs/openapi-3.2.2.json.
 */

/**
 * Resolves a JSON Schema property definition into a TypeScript type expression.
 */
export function resolveTsType(prop, allSchemas = {}) {
  if (!prop) return 'unknown';

  if (prop['$ref']) {
    return prop['$ref'].split('/').pop();
  }

  if (prop.anyOf) {
    const isNullable = prop.anyOf.some(b => b.type === 'null');
    const branches = prop.anyOf.filter(b => b.type !== 'null');
    const branchTypes = branches.map(b => resolveTsType(b, allSchemas));
    // Deduplicate
    const uniqueTypes = Array.from(new Set(branchTypes));
    let union = uniqueTypes.join(' | ') || 'unknown';
    if (isNullable) {
      union += ' | null';
    }
    return union;
  }

  if (prop.enum) {
    return prop.enum.map(e => JSON.stringify(e)).join(' | ');
  }

  if (prop.type === 'string') {
    return 'string';
  }

  if (prop.type === 'integer' || prop.type === 'number') {
    return 'number';
  }

  if (prop.type === 'boolean') {
    return 'boolean';
  }

  if (prop.type === 'array') {
    const itemType = resolveTsType(prop.items, allSchemas);
    return itemType.includes(' ') && !itemType.startsWith('(') ? `(${itemType})[]` : `${itemType}[]`;
  }

  if (prop.type === 'object') {
    if (prop.additionalProperties) {
      if (typeof prop.additionalProperties === 'object' && prop.additionalProperties['$ref']) {
        const refName = prop.additionalProperties['$ref'].split('/').pop();
        return `Record<string, ${refName}>`;
      }
      return 'Record<string, unknown>';
    }
    return 'Record<string, unknown>';
  }

  return 'unknown';
}

/**
 * Generates an interface definition for a schema object.
 */
export function generateInterface(name, schema, allSchemas = {}) {
  const req = new Set(schema.required || []);
  let out = '';

  if (schema.description) {
    out += `/**\n * ${schema.description.replace(/\n/g, '\n * ')}\n */\n`;
  }

  out += `export interface ${name} {\n`;
  for (const [propName, propDef] of Object.entries(schema.properties || {})) {
    const isRequired = req.has(propName);
    const tsType = resolveTsType(propDef, allSchemas);
    if (propDef.description) {
      out += `  /** ${propDef.description.replace(/\n/g, ' ')} */\n`;
    }
    out += `  ${propName}${isRequired ? ': ' : '?: '}${tsType};\n`;
  }
  out += '}\n';
  return out;
}

/**
 * Generates the complete TypeScript types file content from an OpenAPI specification object.
 */
export function generateTypesFromOpenApi(spec) {
  const schemas = spec.components?.schemas || {};

  // Extract $defs from dialectic chat response if present
  const dialecticPost = spec.paths?.['/v3/workspaces/{workspace_id}/peers/{peer_id}/chat']?.post;
  const dialecticSchema = dialecticPost?.responses?.['200']?.content?.['application/json']?.schema;
  const dialecticDefs = dialecticSchema?.['$defs'] || {};

  // Combined schemas map
  const allSchemas = { ...schemas, ...dialecticDefs };

  let out = `/**
 * Honcho v3.2.2 Typed Contracts
 * Schema-driven: generated strictly and reproducibly from OpenAPI snapshot.
 * Tool: scripts/generate-types.mjs
 */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
\n`;

  // Specific type aliases derived from schema enums
  if (schemas.Conclusion?.properties?.level?.enum) {
    const levels = schemas.Conclusion.properties.level.enum.map(l => `'${l}'`).join(' | ');
    out += `export type ConclusionLevel = ${levels};\n\n`;
  } else {
    out += `export type ConclusionLevel = 'explicit' | 'deductive' | 'inductive' | 'contradiction';\n\n`;
  }

  if (schemas.DialecticOptions?.properties?.reasoning_level?.enum) {
    const rLevels = schemas.DialecticOptions.properties.reasoning_level.enum.map(l => `'${l}'`).join(' | ');
    out += `export type ReasoningLevel = ${rLevels};\n\n`;
  } else {
    out += `export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max';\n\n`;
  }

  // Schemas to generate: all schemas present in components.schemas and $defs
  // Maintain deterministic sorted order
  const schemaKeys = Object.keys(allSchemas).sort();

  for (const key of schemaKeys) {
    if (allSchemas[key]) {
      out += generateInterface(key, allSchemas[key], allSchemas) + '\n';
    }
  }

  // Dialectic response & streaming chunk
  out += `export interface DialecticResponse {\n  content: string | null;\n  evidence?: Evidence | null;\n}\n\n`;
  out += `export interface DialecticStreamChunk {\n  delta?: {\n    content?: string;\n  };\n  done: boolean;\n  evidence?: Evidence | null;\n  error?: string;\n}\n`;

  return out;
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const snapshotPath = process.argv[2] || DEFAULT_SNAPSHOT_PATH;
  const targetPath = process.argv[3] || DEFAULT_TARGET_PATH;

  console.log(`[types:generate] Reading OpenAPI snapshot from: ${snapshotPath}`);
  const raw = fs.readFileSync(snapshotPath, 'utf-8');
  const spec = JSON.parse(raw);

  const generated = generateTypesFromOpenApi(spec);
  fs.writeFileSync(targetPath, generated, 'utf-8');
  console.log(`[types:generate] Successfully wrote ${generated.length} bytes to ${targetPath}`);
}
