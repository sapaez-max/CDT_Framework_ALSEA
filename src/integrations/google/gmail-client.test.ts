import { afterEach, describe, expect, it, vi } from 'vitest';
import type { gmail_v1 } from 'googleapis';
import { env } from '@config/env';
import { GmailClient, type CaseEmailExpectation } from './gmail-client';

const scope = { datasetId: 'gmail-client-test' };

function createClient() {
  const list = vi.fn();
  const get = vi.fn();
  const gmail = { users: { messages: { list, get } } } as unknown as gmail_v1.Gmail;
  const Client = GmailClient as unknown as new (api: gmail_v1.Gmail) => GmailClient;
  return { client: new Client(gmail), list, get };
}

function message(id: string, subject: string) {
  return {
    data: {
      id,
      payload: {
        headers: [
          { name: 'From', value: env.gmail.expectedFrom },
          { name: 'Subject', value: subject },
        ],
      },
    },
  };
}

function expectation(): CaseEmailExpectation {
  return { caseId: 'CP4', subject: 'Carga de menu', bodyFields: [], artifactScope: scope };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('GmailClient', () => {
  it('usa la misma busqueda para la linea base y la espera de plantillas', async () => {
    const { client, list } = createClient();
    list.mockResolvedValueOnce({ data: { messages: [] } });
    list.mockRejectedValueOnce(new Error('fin de prueba'));

    const baseline = await client.captureTemplateEmailBaseline();
    await expect(client.waitForTemplateEmail(baseline, {
      caseId: 'CP1', country: 'MEXICO', brand: 'STARBUCKS',
      branch: '38109', menuType: 'Delivery BIS', artifactScope: scope,
    })).rejects.toThrow('fin de prueba');

    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[1][0].q).toBe(list.mock.calls[0][0].q);
  });

  it('no descarga de nuevo un mensaje descartado en el siguiente sondeo', async () => {
    vi.useFakeTimers();
    const { client, list, get } = createClient();
    list.mockResolvedValueOnce({ data: { messages: [{ id: 'otro' }] } });
    list.mockResolvedValueOnce({ data: { messages: [{ id: 'nuevo' }, { id: 'otro' }] } });
    get.mockImplementation(({ id }: { id: string }) => Promise.resolve(
      message(id, id === 'nuevo' ? 'Carga de menu' : 'Otro asunto'),
    ));

    const result = client.waitForCaseEmail(new Set(), expectation());
    await vi.advanceTimersByTimeAsync(env.gmail.pollIntervalMs);

    expect((await result).messageId).toBe('nuevo');
    expect(get.mock.calls.map(([args]) => args.id)).toEqual(['otro', 'nuevo']);
  });

  it('reintenta una cuota temporal antes de volver a consultar', async () => {
    vi.useFakeTimers();
    const { client, list, get } = createClient();
    const quotaError = Object.assign(new Error('Quota exceeded for quota metric Total Query Cost'), {
      response: { status: 403 },
    });
    list.mockRejectedValueOnce(quotaError);
    list.mockResolvedValueOnce({ data: { messages: [{ id: 'nuevo' }] } });
    get.mockResolvedValue(message('nuevo', 'Carga de menu'));

    const result = client.waitForCaseEmail(new Set(), expectation());
    await vi.advanceTimersByTimeAsync(4_999);
    expect(list).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    expect((await result).messageId).toBe('nuevo');
    expect(list).toHaveBeenCalledTimes(2);
  });
});
