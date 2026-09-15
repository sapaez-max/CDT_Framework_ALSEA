import { describe, expect, it } from 'vitest';
import {
  resolveModifierGroupRelations,
  selectEditableRelation,
  normalizeSubgroupIds,
  buildResolvedGroupId,
  buildRelationKey,
  saveRelationSnapshot,
  loadRelationSnapshot,
  type BaseModifierGroupInput,
  type ModifierGroupRelationInput,
  type ModifierSubgroupInput,
} from './modifier-group-relations';

function makeBaseGroups(): BaseModifierGroupInput[] {
  return [
    { id: '20061_1', name: 'Grupo Leche', position: 1 },
  ];
}

function makeModifiers(overrides?: ModifierGroupRelationInput[]): ModifierGroupRelationInput[] {
  return overrides ?? [
    { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: null, source: { sheet: 'Modificadores', row: 2 } },
    { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: null, source: { sheet: 'Modificadores', row: 3 } },
  ];
}

function makeSubgroups(): ModifierSubgroupInput[] {
  return [
    { id: 'I', name: 'Leche I' },
    { id: 'F', name: 'Leche F' },
  ];
}

describe('resolveModifierGroupRelations', () => {
  it('1. subgrupo vacío produce el grupo base sin sufijo', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers(),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(1);
    expect(relations[0].identity).toEqual({ itemId: '20061', baseGroupId: '20061_1', subgroupId: null });
    expect(relations[0].resolvedGroup).toEqual({ id: '20061_1', name: 'Grupo Leche' });
    expect(relations[0].modifiers).toHaveLength(2);
  });

  it('2. un subgrupo produce GrupoBase_I', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: 'I', source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: 'I', source: { sheet: 'Modificadores', row: 3 } },
      ]),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(1);
    expect(relations[0].identity.subgroupId).toBe('I');
    expect(relations[0].resolvedGroup).toEqual({ id: '20061_1_I', name: 'Leche I' });
  });

  it('3. varios subgrupos producen relaciones separadas', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: 'I,F', source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: 'I,F', source: { sheet: 'Modificadores', row: 3 } },
      ]),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(2);
    expect(relations[0].identity.subgroupId).toBe('F');
    expect(relations[0].resolvedGroup.id).toBe('20061_1_F');
    expect(relations[1].identity.subgroupId).toBe('I');
    expect(relations[1].resolvedGroup.id).toBe('20061_1_I');
  });

  it('4. mezcla de grupo base y subgrupos genera todas las relaciones', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: null, source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: 'I', source: { sheet: 'Modificadores', row: 3 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_C', name: 'Mod C', position: 3, rawSubgroups: 'I,F', source: { sheet: 'Modificadores', row: 4 } },
      ]),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(3);
    const base = relations.find(r => r.identity.subgroupId === null);
    const groupI = relations.find(r => r.identity.subgroupId === 'I');
    const groupF = relations.find(r => r.identity.subgroupId === 'F');

    expect(base).toBeDefined();
    expect(base!.modifiers.map(m => m.id)).toEqual(['MOD_A']);

    expect(groupI).toBeDefined();
    expect(groupI!.modifiers.map(m => m.id)).toEqual(['MOD_B', 'MOD_C']);

    expect(groupF).toBeDefined();
    expect(groupF!.modifiers.map(m => m.id)).toEqual(['MOD_C']);
  });

  it('5. código inexistente en la hoja Subgrupos lanza error', () => {
    expect(() => resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: 'X', source: { sheet: 'Modificadores', row: 2 } },
      ]),
      subgroups: makeSubgroups(),
    })).toThrow('No se encontro el Subgrupo X');
  });

  it('6. espacios, separadores y códigos duplicados se normalizan', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: ' I , F ', source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: 'I,F,I', source: { sheet: 'Modificadores', row: 3 } },
      ]),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(2);
    expect(relations[0].modifiers).toHaveLength(2);
    expect(relations[1].modifiers).toHaveLength(2);
  });

  it('7. un modificador pertenece a varias relaciones', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: 'I,F', source: { sheet: 'Modificadores', row: 2 } },
      ]),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(2);
    for (const relation of relations) {
      expect(relation.modifiers).toHaveLength(1);
      expect(relation.modifiers[0].id).toBe('MOD_A');
    }
  });

  it('8. dos items que utilizan el mismo grupo base generan relaciones separadas', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: [{ id: '20061_1', name: 'Grupo Leche', position: 1 }],
      modifiers: [
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: null, source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '99999', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: null, source: { sheet: 'Modificadores', row: 3 } },
      ],
      subgroups: [],
    });

    expect(relations).toHaveLength(2);
    expect(relations[0].identity.itemId).toBe('20061');
    expect(relations[1].identity.itemId).toBe('99999');
  });

  it('9. dos modificadores con subgrupos diferentes no se mezclan en la misma relación', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: 'I', source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: 'F', source: { sheet: 'Modificadores', row: 3 } },
      ]),
      subgroups: makeSubgroups(),
    });

    expect(relations).toHaveLength(2);
    const groupI = relations.find(r => r.identity.subgroupId === 'I');
    const groupF = relations.find(r => r.identity.subgroupId === 'F');

    expect(groupI!.modifiers.map(m => m.id)).toEqual(['MOD_A']);
    expect(groupF!.modifiers.map(m => m.id)).toEqual(['MOD_B']);
  });

  it('10. consistencia entre resolución directa y carga de snapshot', () => {
    const input = {
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers(),
      subgroups: makeSubgroups(),
    };

    const relations = resolveModifierGroupRelations(input);
    const snapshot = saveRelationSnapshot(relations, { cpId: 'CP2', datasetId: 'starbucks', runId: 'run1' }, { fileName: 'test.xlsx', hash: 'abc123' });
    const loaded = loadRelationSnapshot(snapshot, { fileName: 'test.xlsx', hash: 'abc123' });

    expect(loaded).toEqual(relations);
  });
});

describe('selectEditableRelation', () => {
  it('retorna la primera relación con al menos N modificadores', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: 'I', source: { sheet: 'Modificadores', row: 2 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_B', name: 'Mod B', position: 2, rawSubgroups: 'I', source: { sheet: 'Modificadores', row: 3 } },
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_C', name: 'Mod C', position: 3, rawSubgroups: 'F', source: { sheet: 'Modificadores', row: 4 } },
      ]),
      subgroups: makeSubgroups(),
    });

    const editable = selectEditableRelation(relations, 2);
    expect(editable).toBeDefined();
    expect(editable!.modifiers.length).toBeGreaterThanOrEqual(2);
  });

  it('retorna undefined cuando ninguna relación alcanza el mínimo', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers([
        { itemId: '20061', baseGroupId: '20061_1', id: 'MOD_A', name: 'Mod A', position: 1, rawSubgroups: null, source: { sheet: 'Modificadores', row: 2 } },
      ]),
      subgroups: makeSubgroups(),
    });

    const editable = selectEditableRelation(relations, 2);
    expect(editable).toBeUndefined();
  });
});

describe('normalizeSubgroupIds', () => {
  it('normaliza valores vacíos', () => {
    expect(normalizeSubgroupIds(null)).toEqual([]);
    expect(normalizeSubgroupIds('')).toEqual([]);
    expect(normalizeSubgroupIds('  ')).toEqual([]);
  });

  it('normaliza un solo código', () => {
    expect(normalizeSubgroupIds('I')).toEqual(['I']);
  });

  it('normaliza múltiples códigos con diferentes separadores', () => {
    expect(normalizeSubgroupIds('I,F')).toEqual(['I', 'F']);
    expect(normalizeSubgroupIds('I;F')).toEqual(['I', 'F']);
    expect(normalizeSubgroupIds('I|F')).toEqual(['I', 'F']);
  });

  it('elimina duplicados', () => {
    expect(normalizeSubgroupIds('I,F,I')).toEqual(['I', 'F']);
  });

  it('trimma espacios', () => {
    expect(normalizeSubgroupIds(' I , F ')).toEqual(['I', 'F']);
  });
});

describe('buildResolvedGroupId', () => {
  it('retorna grupo base cuando subgroupId es null', () => {
    expect(buildResolvedGroupId('20061_1', null)).toBe('20061_1');
  });

  it('agrega sufijo de subgrupo', () => {
    expect(buildResolvedGroupId('20061_1', 'I')).toBe('20061_1_I');
  });

  it('no duplica sufijo si ya existe', () => {
    expect(buildResolvedGroupId('20061_1_I', 'I')).toBe('20061_1_I');
  });
});

describe('buildRelationKey', () => {
  it('serializa identidad como JSON array', () => {
    const key = buildRelationKey({ itemId: '20061', baseGroupId: '20061_1', subgroupId: null });
    expect(key).toBe('["20061","20061_1",null]');
  });

  it('incluye subgroupId cuando no es null', () => {
    const key = buildRelationKey({ itemId: '20061', baseGroupId: '20061_1', subgroupId: 'I' });
    expect(key).toBe('["20061","20061_1","I"]');
  });
});

describe('saveRelationSnapshot / loadRelationSnapshot', () => {
  it('guarda y carga un snapshot válido', () => {
    const relations = resolveModifierGroupRelations({
      baseGroups: makeBaseGroups(),
      modifiers: makeModifiers(),
      subgroups: makeSubgroups(),
    });

    const snapshot = saveRelationSnapshot(
      relations,
      { cpId: 'CP2', datasetId: 'starbucks', runId: 'run1' },
      { fileName: 'template.xlsx', hash: 'hash123' },
    );

    expect(snapshot.sourceWorkbook).toEqual({ fileName: 'template.xlsx', hash: 'hash123' });
    expect(snapshot.resolverVersion).toBe(1);
    expect(snapshot.relations).toEqual(relations);

    const loaded = loadRelationSnapshot(snapshot, { fileName: 'template.xlsx', hash: 'hash123' });
    expect(loaded).toEqual(relations);
  });

  it('lanza error si la versión del snapshot es incompatible', () => {
    const snapshot = {
      sourceWorkbook: { fileName: 'a.xlsx', hash: 'h' },
      resolvedAt: new Date().toISOString(),
      resolverVersion: 999,
      relations: [],
    };

    expect(() => loadRelationSnapshot(snapshot)).toThrow('Version de resolvedor incompatible');
  });

  it('lanza error si el nombre del archivo no coincide', () => {
    const snapshot = {
      sourceWorkbook: { fileName: 'other.xlsx', hash: 'h' },
      resolvedAt: new Date().toISOString(),
      resolverVersion: 1,
      relations: [],
    };

    expect(() => loadRelationSnapshot(snapshot, { fileName: 'expected.xlsx', hash: 'h' }))
      .toThrow('corresponde al archivo');
  });

  it('lanza error si el hash no coincide', () => {
    const snapshot = {
      sourceWorkbook: { fileName: 'a.xlsx', hash: 'old_hash' },
      resolvedAt: new Date().toISOString(),
      resolverVersion: 1,
      relations: [],
    };

    expect(() => loadRelationSnapshot(snapshot, { fileName: 'a.xlsx', hash: 'new_hash' }))
      .toThrow('hash del snapshot');
  });

  it('carga sin validación cuando no se provee metadata esperada', () => {
    const snapshot = {
      sourceWorkbook: { fileName: 'any.xlsx', hash: 'any' },
      resolvedAt: new Date().toISOString(),
      resolverVersion: 1,
      relations: [],
    };

    const loaded = loadRelationSnapshot(snapshot);
    expect(loaded).toEqual([]);
  });
});
