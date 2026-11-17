/**
 * @file helpers.ts
 * @description Helper functions for validating, exporting, and parsing universal node graph documents.
 */

import { UniversalNodeGraphDocument, NodeGraphValidationResult } from './types.js';

/**
 * Validates a parsed JSON object to verify it matches the UniversalNodeGraphDocument schema.
 */
export function validateGraphDocument(data: any): NodeGraphValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON: payload must be a JSON object'] };
  }

  if (!data.appId) errors.push('Missing required property: appId');
  if (!data.appName) errors.push('Missing required property: appName');
  if (!data.graph || typeof data.graph !== 'object') {
    errors.push('Missing or invalid property: graph');
  } else {
    if (!Array.isArray(data.graph.nodes)) errors.push('Missing or invalid property: graph.nodes (must be array)');
    if (!Array.isArray(data.graph.edges)) errors.push('Missing or invalid property: graph.edges (must be array)');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    document: data as UniversalNodeGraphDocument,
  };
}

/**
 * Triggers a browser download of the node graph as a portable JSON file.
 */
export function exportGraphAsJsonFile(graphDoc: UniversalNodeGraphDocument) {
  if (typeof window === 'undefined') return;
  const jsonString = JSON.stringify(graphDoc, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = (graphDoc.appName || 'graph').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `${safeName}_${graphDoc.appId}.graph.json`;

  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses a graph JSON file from an input file element.
 */
export async function parseGraphJsonFile(file: File): Promise<NodeGraphValidationResult> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return validateGraphDocument(parsed);
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Failed to parse JSON: ${err.message}`],
    };
  }
}
