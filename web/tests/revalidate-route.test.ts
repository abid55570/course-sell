import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

function post(secret?: string) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: secret === undefined ? {} : { 'x-revalidate-secret': secret },
  });
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
    vi.resetModules();
  });
  afterEach(() => {
    delete process.env.REVALIDATE_SECRET;
  });

  it('revalidates the catalog tag when the secret matches', async () => {
    process.env.REVALIDATE_SECRET = 's3cret';
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post('s3cret'));
    expect(res.status).toBe(204);
    // Two-argument form: the one-argument version is deprecated in Next 16 and
    // makes the next request a blocking cache miss instead of serving stale.
    expect(revalidateTag).toHaveBeenCalledWith('catalog', 'max');
  });

  it('rejects a wrong secret', async () => {
    process.env.REVALIDATE_SECRET = 's3cret';
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(post('wrong'))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a missing secret header', async () => {
    process.env.REVALIDATE_SECRET = 's3cret';
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(post())).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('refuses every request when no secret is configured, rather than defaulting to open', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post('anything'));
    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('does not accept an empty secret as a match for an unset one', async () => {
    process.env.REVALIDATE_SECRET = '';
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(post(''))).status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
