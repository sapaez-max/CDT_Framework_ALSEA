export type RelationIdentity = {
  itemId: string;
  baseGroupId: string;
  subgroupId: string | null;
};

export type RelationSource = {
  sheet: string;
  row: number;
};

export type ModifierGroupRelationInput = {
  itemId: string;
  baseGroupId: string;
  id: string;
  name: string;
  position: number;
  rawSubgroups: unknown;
  source: RelationSource;
};

export type BaseModifierGroupInput = {
  id: string;
  name: string;
  position: number;
  source?: RelationSource;
};

export type ModifierSubgroupInput = {
  id: string;
  name: string;
  source?: RelationSource;
};

export type ResolvedRelationModifier = {
  id: string;
  name: string;
  position: number;
  rawSubgroups: string | null;
  source: RelationSource;
};

export type ModifierGroupRelation = {
  key: string;
  identity: RelationIdentity;
  baseGroup: BaseModifierGroupInput;
  subgroup: ModifierSubgroupInput | null;
  resolvedGroup: {
    id: string;
    name: string;
  };
  modifiers: ResolvedRelationModifier[];
};

export function resolveModifierGroupRelations(input: {
  baseGroups: BaseModifierGroupInput[];
  modifiers: ModifierGroupRelationInput[];
  subgroups: ModifierSubgroupInput[];
}): ModifierGroupRelation[] {
  const baseGroupsById = new Map(
    input.baseGroups.map(group => [canonicalId(group.id), {
      ...group,
      id: canonicalId(group.id),
    }]),
  );
  const subgroupsById = new Map(
    input.subgroups.map(subgroup => [canonicalId(subgroup.id), {
      ...subgroup,
      id: canonicalId(subgroup.id),
    }]),
  );
  const relations = new Map<string, ModifierGroupRelation>();

  for (const inputModifier of input.modifiers) {
    const itemId = canonicalId(inputModifier.itemId);
    const baseGroupId = canonicalId(inputModifier.baseGroupId);
    const modifierId = canonicalId(inputModifier.id);
    const baseGroup = baseGroupsById.get(baseGroupId);
    if (!itemId || !baseGroup || !modifierId) continue;

    const rawSubgroups = nullableText(inputModifier.rawSubgroups);
    const subgroupIds = normalizeSubgroupIds(inputModifier.rawSubgroups);
    const memberships: Array<string | null> = subgroupIds.length > 0 ? subgroupIds : [null];

    for (const subgroupId of memberships) {
      const subgroup = subgroupId === null ? null : subgroupsById.get(subgroupId);
      if (subgroupId !== null && (!subgroup || !displayValue(subgroup.name))) {
        throw new Error(
          `No se encontro el Subgrupo ${subgroupId} con Nombre Comercial. `
          + `Origen: ${inputModifier.source.sheet}, fila ${inputModifier.source.row}.`,
        );
      }

      const identity = { itemId, baseGroupId, subgroupId };
      const key = buildRelationKey(identity);
      const current = relations.get(key) ?? {
        key,
        identity,
        baseGroup,
        subgroup: subgroup ?? null,
        resolvedGroup: {
          id: buildResolvedGroupId(baseGroupId, subgroupId),
          name: subgroup?.name ?? baseGroup.name,
        },
        modifiers: [],
      };

      if (!current.modifiers.some(modifier =>
        modifier.id === modifierId
        && modifier.source.sheet === inputModifier.source.sheet
        && modifier.source.row === inputModifier.source.row)) {
        current.modifiers.push({
          id: modifierId,
          name: displayValue(inputModifier.name),
          position: inputModifier.position,
          rawSubgroups,
          source: inputModifier.source,
        });
      }
      relations.set(key, current);
    }
  }

  return [...relations.values()]
    .map(relation => ({
      ...relation,
      modifiers: [...relation.modifiers].sort((left, right) => left.position - right.position),
    }))
    .sort((left, right) =>
      left.baseGroup.position - right.baseGroup.position
      || compareNullable(left.identity.subgroupId, right.identity.subgroupId));
}

export function selectEditableRelation(
  relations: ModifierGroupRelation[],
  minimumModifiers = 2,
): ModifierGroupRelation | undefined {
  return relations.find(relation => relation.modifiers.length >= minimumModifiers);
}

export function normalizeSubgroupIds(value: unknown): string[] {
  const ids = displayValue(value)
    .split(/[,;|]/)
    .map(canonicalId)
    .filter(Boolean);
  return [...new Set(ids)];
}

export function buildResolvedGroupId(baseGroupId: string, subgroupId: string | null): string {
  const normalizedBaseGroupId = canonicalId(baseGroupId);
  const normalizedSubgroupId = subgroupId === null ? '' : canonicalId(subgroupId);
  if (!normalizedBaseGroupId) {
    throw new Error('Grupo Modificador es obligatorio para construir el identificador resuelto.');
  }
  if (!normalizedSubgroupId) return normalizedBaseGroupId;

  const suffix = `_${normalizedSubgroupId}`;
  return normalizedBaseGroupId.endsWith(suffix)
    ? normalizedBaseGroupId
    : `${normalizedBaseGroupId}${suffix}`;
}

export function buildRelationKey(identity: RelationIdentity): string {
  return JSON.stringify([
    canonicalId(identity.itemId),
    canonicalId(identity.baseGroupId),
    identity.subgroupId === null ? null : canonicalId(identity.subgroupId),
  ]);
}

function compareNullable(left: string | null, right: string | null): number {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left.localeCompare(right);
}

function canonicalId(value: unknown): string {
  const text = displayValue(value);
  return /^-?\d+\.0+$/.test(text) ? text.replace(/\.0+$/, '') : text;
}

function nullableText(value: unknown): string | null {
  const text = displayValue(value);
  return text || null;
}

function displayValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

export type RelationSnapshotContext = {
  cpId: string;
  datasetId: string;
  runId: string;
};

export type RelationSnapshot = {
  sourceWorkbook: {
    fileName: string;
    hash: string;
  };
  resolvedAt: string;
  resolverVersion: number;
  relations: ModifierGroupRelation[];
};

const RESOLVER_VERSION = 1;

export function saveRelationSnapshot(
  relations: ModifierGroupRelation[],
  context: RelationSnapshotContext,
  workbookMeta: { fileName: string; hash: string },
): RelationSnapshot {
  return {
    sourceWorkbook: workbookMeta,
    resolvedAt: new Date().toISOString(),
    resolverVersion: RESOLVER_VERSION,
    relations,
  };
}

export function loadRelationSnapshot(
  snapshot: RelationSnapshot,
  expectedWorkbookMeta?: { fileName: string; hash: string },
): ModifierGroupRelation[] {
  if (snapshot.resolverVersion !== RESOLVER_VERSION) {
    throw new Error(
      `Version de resolvedor incompatible: esperada ${RESOLVER_VERSION}, encontrada ${snapshot.resolverVersion}.`,
    );
  }

  if (expectedWorkbookMeta) {
    if (snapshot.sourceWorkbook.fileName !== expectedWorkbookMeta.fileName) {
      throw new Error(
        `El snapshot corresponde al archivo "${snapshot.sourceWorkbook.fileName}", `
        + `pero se esperaba "${expectedWorkbookMeta.fileName}".`,
      );
    }
    if (snapshot.sourceWorkbook.hash !== expectedWorkbookMeta.hash) {
      throw new Error(
        `El hash del snapshot (${snapshot.sourceWorkbook.hash}) no coincide `
        + `con el hash del archivo actual (${expectedWorkbookMeta.hash}).`,
      );
    }
  }

  return snapshot.relations;
}
