import { describe, expect, it } from 'vitest';
import { replaceAutomationSuffix } from './item-selection-history';

describe('replaceAutomationSuffix', () => {
  const timestamp = '20260915_142316';

  it('conserva el nombre comercial de un grupo modificador y agrega el sufijo actual', () => {
    expect(replaceAutomationSuffix('Adicionales', 'CP2', timestamp)).toEqual({
      baseName: 'Adicionales',
      generatedName: 'Adicionales_AUTO_CP2_20260915_142316',
    });
  });

  it('reemplaza solo el sufijo final anterior de un grupo modificador', () => {
    expect(replaceAutomationSuffix('Adicionales_AUTO_CP2_20260910_101530', 'CP2', timestamp)).toEqual({
      baseName: 'Adicionales',
      generatedName: 'Adicionales_AUTO_CP2_20260915_142316',
    });
  });

  it('conserva el nombre comercial de un modificador y agrega el sufijo actual', () => {
    expect(replaceAutomationSuffix('Con crema batida', 'CP2', timestamp)).toEqual({
      baseName: 'Con crema batida',
      generatedName: 'Con crema batida_AUTO_CP2_20260915_142316',
    });
  });

  it('reemplaza solo el sufijo final anterior de un modificador', () => {
    expect(replaceAutomationSuffix('Con crema batida_AUTO_CP2_20260910_101530', 'CP2', timestamp)).toEqual({
      baseName: 'Con crema batida',
      generatedName: 'Con crema batida_AUTO_CP2_20260915_142316',
    });
  });

  it('no elimina texto parecido si el sufijo no esta al final', () => {
    expect(replaceAutomationSuffix('Promo_AUTO_CP2_20260910_101530 grande', 'CP2', timestamp)).toEqual({
      baseName: 'Promo_AUTO_CP2_20260910_101530 grande',
      generatedName: 'Promo_AUTO_CP2_20260910_101530 grande_AUTO_CP2_20260915_142316',
    });
  });
});
