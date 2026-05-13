import { buildCurl } from '@/lib/curl';

describe('buildCurl', () => {
  it('omits -X for GET', () => {
    expect(buildCurl({ method: 'GET', url: 'https://example.com/x' })).toBe(
      `curl 'https://example.com/x'`,
    );
  });

  it('uppercases method and adds -X for non-GET', () => {
    expect(buildCurl({ method: 'post', url: 'https://api/x' })).toBe(
      `curl -X POST 'https://api/x'`,
    );
  });

  it('escapes single quotes in url', () => {
    expect(buildCurl({ method: 'GET', url: `https://a/b?q='hi'` })).toBe(
      `curl 'https://a/b?q='\\''hi'\\'''`,
    );
  });
});
