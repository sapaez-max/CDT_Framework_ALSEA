import { readCoreViewerExpectation } from '@utils/core-viewer-template';
import {
  copyExcelFromPreviousCase,
  type ArtifactScope,
} from '@utils/case-artifact-manager';
import { editDownloadedTemplate } from '@utils/template-editor';

export class ExcelService {
  copyFromCase(fromCase: string, toCase: string, scope: ArtifactScope) {
    return copyExcelFromPreviousCase({ fromCase, toCase, scope });
  }

  editTemplate(caseId: string, sourceCaseId: string, aggregator: string, scope: ArtifactScope) {
    return editDownloadedTemplate({ caseId, sourceCaseId, aggregator, artifactScope: scope });
  }

  readViewerExpectation(filePath: string) {
    return readCoreViewerExpectation(filePath);
  }
}
