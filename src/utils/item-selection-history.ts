import fs from 'fs';
import path from 'path';

export type ItemSelectionCandidate = {
  itemId: string;
  itemName: string;
};

type ItemSelectionHistory = {
  datasetId: string;
  lastItemId: string;
  baseItemName: string;
  generatedItemName: string;
  selectedAt: string;
};

const markedSuffixPattern = /_AUTO_CP\d+_\d{8}_\d{6}$/i;
const timestampSuffixPattern = /_\d{8}_\d{6}$/;
const legacyDateSuffixPattern = /_\d{8}$/;

export function normalizeAutomatedItemName(value: string): string {
  const original = value.trim();
  let normalized = original;
  let removedAutomationSuffix = false;

  while (markedSuffixPattern.test(normalized) || timestampSuffixPattern.test(normalized)) {
    normalized = (markedSuffixPattern.test(normalized)
      ? normalized.replace(markedSuffixPattern, '')
      : normalized.replace(timestampSuffixPattern, '')).trim();
    removedAutomationSuffix = true;
  }

  if (removedAutomationSuffix) {
    while (legacyDateSuffixPattern.test(normalized)) {
      normalized = normalized.replace(legacyDateSuffixPattern, '').trim();
    }
  }

  return normalized || original;
}

export function buildAutomatedItemName(
  currentName: string,
  caseId: string,
  executionTimestamp: string,
): { baseName: string; generatedName: string } {
  const baseName = normalizeAutomatedItemName(currentName);
  return {
    baseName,
    generatedName: `${baseName}_AUTO_${caseId}_${executionTimestamp}`,
  };
}

export function chooseRotatingItem<T extends ItemSelectionCandidate>(
  candidates: T[],
  datasetId: string,
): T {
  if (candidates.length === 0) {
    throw new Error('No existen items elegibles para aplicar la rotación.');
  }

  const candidatesByItem = new Map<string, T>();
  for (const candidate of candidates) {
    if (!candidatesByItem.has(candidate.itemId)) {
      candidatesByItem.set(candidate.itemId, candidate);
    }
  }
  const uniqueCandidates = [...candidatesByItem.values()];
  const pristineCandidates = uniqueCandidates.filter(candidate =>
    normalizeAutomatedItemName(candidate.itemName) === candidate.itemName.trim());
  const pool = pristineCandidates.length > 0 ? pristineCandidates : uniqueCandidates;
  const lastItemId = readSelectionHistory(datasetId)?.lastItemId;
  const lastIndex = lastItemId ? pool.findIndex(candidate => candidate.itemId === lastItemId) : -1;

  return pool[(lastIndex + 1) % pool.length];
}

export function recordItemSelection(input: {
  datasetId: string;
  itemId: string;
  baseItemName: string;
  generatedItemName: string;
  selectedAt: string;
}): void {
  const filePath = historyFile(input.datasetId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const history: ItemSelectionHistory = {
    datasetId: input.datasetId,
    lastItemId: input.itemId,
    baseItemName: input.baseItemName,
    generatedItemName: input.generatedItemName,
    selectedAt: input.selectedAt,
  };
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf8');
}

function readSelectionHistory(datasetId: string): ItemSelectionHistory | undefined {
  const filePath = historyFile(datasetId);
  if (!fs.existsSync(filePath)) return undefined;

  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<ItemSelectionHistory>;
    return typeof value.lastItemId === 'string'
      ? value as ItemSelectionHistory
      : undefined;
  } catch (error) {
    throw new Error(
      `No se pudo leer el historial de selección de items para el dataset ${datasetId}: ${filePath}.`,
      { cause: error },
    );
  }
}

function historyFile(datasetId: string): string {
  return path.resolve(
    'artifacts',
    'state',
    'item-selection',
    `${safeSegment(datasetId)}.json`,
  );
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
