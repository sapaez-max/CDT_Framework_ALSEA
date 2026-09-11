import { readCoreViewerExpectation } from '@utils/core-viewer-template';
import {
  copyExcelFromPreviousCase,
  type ArtifactScope,
} from '@utils/case-artifact-manager';
import { reorderGroupsAndModifiers, reorderOnlyGroups, reorderOnlyModifiers } from '@utils/group-reorder-template';
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

  readViewerExpectation(filePath: string) {
    return readCoreViewerExpectation(filePath);
  }
}
