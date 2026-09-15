import { readCoreViewerExpectation } from '@utils/core-viewer-template';
import {
  copyExcelFromCurrentCaseOrPrevious,
  copyExcelFromPreviousCase,
  getLatestExcelForCase,
  type ArtifactScope,
} from '@utils/case-artifact-manager';
import {
  readGroupsAndModifiersExpectation,
  renameItemPreservingOrder,
  reorderGroupsAndModifiers,
  reorderOnlyGroups,
  reorderOnlyModifiers,
} from '@utils/group-reorder-template';
import { editDownloadedTemplate } from '@utils/template-editor';

export class ExcelService {
  copyFromCase(fromCase: string, toCase: string, scope: ArtifactScope) {
    return copyExcelFromPreviousCase({ fromCase, toCase, scope });
  }

  referenceFromCase(fromCase: string, _scope: ArtifactScope) {
    return { sourcePath: getLatestExcelForCase(fromCase, _scope) };
  }

  editTemplate(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    return editDownloadedTemplate({ caseId, sourceCaseId, aggregator, artifactScope: scope });
  }

  reorderGroups(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    return reorderOnlyGroups({ caseId, sourceCaseId, aggregator, artifactScope: scope });
  }

  reorderModifiers(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    return reorderOnlyModifiers({ caseId, sourceCaseId, aggregator, artifactScope: scope });
  }

  reorderGroupsAndModifiers(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    return reorderGroupsAndModifiers({ caseId, sourceCaseId, aggregator, artifactScope: scope });
  }

  inspectExistingMenu(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    const sourcePath = getLatestExcelForCase(sourceCaseId, scope);
    return {
      sourcePath,
      expectation: readGroupsAndModifiersExpectation(sourcePath, aggregator),
    };
  }

  inspectCompleteExistingMenu(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    const sourcePath = getLatestExcelForCase(sourceCaseId, scope);
    const selected = readGroupsAndModifiersExpectation(sourcePath, aggregator);
    return {
      sourcePath,
      expectation: readGroupsAndModifiersExpectation(sourcePath, aggregator, {
        itemId: selected.itemId,
        includeAllGroups: true,
        minimumModifiersPerGroup: 1,
        excludeAutomatedModifiers: false,
      }),
    };
  }

  inspectMultipleGroupsExistingMenu(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    const sourcePath = getLatestExcelForCase(sourceCaseId, scope);
    return {
      sourcePath,
      expectation: readGroupsAndModifiersExpectation(sourcePath, aggregator, {
        minimumGroups: 4,
        minimumModifiersPerGroup: 2,
        requireUniqueModifierOrders: false,
      }),
    };
  }

  updateExistingMenu(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    const sourceCopy = copyExcelFromCurrentCaseOrPrevious({
      previousCase: sourceCaseId,
      currentCase: caseId,
      scope,
    });
    return reorderGroupsAndModifiers({
      caseId,
      sourceCaseId,
      aggregator,
      artifactScope: scope,
      sourceCopy,
      strategy: 'selective-update',
    });
  }

  reorderMultipleGroups(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    const sourceCopy = copyExcelFromCurrentCaseOrPrevious({
      previousCase: sourceCaseId,
      currentCase: caseId,
      scope,
    });
    return reorderGroupsAndModifiers({
      caseId,
      sourceCaseId,
      aggregator,
      artifactScope: scope,
      sourceCopy,
      strategy: 'multiple-groups',
    });
  }

  reloadPreservingOrder(
    caseId: string,
    sourceCaseId: string,
    aggregator: string,
    scope: ArtifactScope,
    itemNameSuffix: string,
  ) {
    const sourceCopy = copyExcelFromCurrentCaseOrPrevious({
      previousCase: sourceCaseId,
      currentCase: caseId,
      scope,
    });
    return renameItemPreservingOrder({
      caseId,
      sourceCaseId,
      aggregator,
      artifactScope: scope,
      sourceCopy,
      itemNameSuffix,
    });
  }

  readViewerExpectation(filePath: string) {
    return readCoreViewerExpectation(filePath);
  }
}
