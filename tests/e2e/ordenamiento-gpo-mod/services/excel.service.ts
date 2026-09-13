import { readCoreViewerExpectation } from '@utils/core-viewer-template';
import {
  copyExcelFromCurrentCaseOrPrevious,
  copyExcelFromPreviousCase,
  getExcelFromCurrentCaseOrPrevious,
  type ArtifactScope,
} from '@utils/case-artifact-manager';
import {
  readGroupsAndModifiersExpectation,
  reorderGroupsAndModifiers,
  reorderOnlyGroups,
  reorderOnlyModifiers,
} from '@utils/group-reorder-template';
import { editDownloadedTemplate } from '@utils/template-editor';

export class ExcelService {
  copyFromCase(fromCase: string, toCase: string, scope: ArtifactScope) {
    return copyExcelFromPreviousCase({ fromCase, toCase, scope });
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
    const sourcePath = getExcelFromCurrentCaseOrPrevious({
      previousCase: sourceCaseId,
      currentCase: caseId,
      scope,
    });
    return {
      sourcePath,
      expectation: readGroupsAndModifiersExpectation(sourcePath, aggregator),
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

  readViewerExpectation(filePath: string) {
    return readCoreViewerExpectation(filePath);
  }
}
