import { wikiThumbToUpload, normalizeImageUrl, buildProxyUrl, resolveSiteImageUrl } from '../src/utils/imageUtils';

describe('imageUtils', () => {
  describe('wikiThumbToUpload', () => {
    it('converts thumb.wikimedia.org URLs to clean direct upload URLs', () => {
      const thumb = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Shore_Temple_-Mamallapuram_-Tamil_Nadu_-N-TN-C55.jpg/330px-Shore_Temple_-Mamallapuram_-Tamil_Nadu_-N-TN-C55.jpg?utm_source=test';
      const expected = 'https://upload.wikimedia.org/wikipedia/commons/7/74/Shore_Temple_-Mamallapuram_-Tamil_Nadu_-N-TN-C55.jpg';
      expect(wikiThumbToUpload(thumb)).toBe(expected);
    });

    it('converts upload.wikimedia.org thumbnail URLs with width suffix to clean direct upload URLs', () => {
      const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Thanjavur_Aranmanai_Urkoodam.JPG/600px-Thanjavur_Aranmanai_Urkoodam.JPG';
      const expected = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Thanjavur_Aranmanai_Urkoodam.JPG';
      expect(wikiThumbToUpload(thumb)).toBe(expected);
    });

    it('returns null for non-thumbnail URLs', () => {
      expect(wikiThumbToUpload('https://upload.wikimedia.org/wikipedia/commons/a/ab/File.jpg')).toBeNull();
      expect(wikiThumbToUpload('https://example.com/image.jpg')).toBeNull();
      expect(wikiThumbToUpload(null)).toBeNull();
      expect(wikiThumbToUpload('')).toBeNull();
    });
  });

  describe('normalizeImageUrl', () => {
    it('strips all UTM tracking parameters', () => {
      const raw = 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Brihadeeswarar_Temple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail';
      const normalized = normalizeImageUrl(raw);
      expect(normalized).toBe('https://upload.wikimedia.org/wikipedia/commons/a/a4/Brihadeeswarar_Temple.jpg');
      expect(normalized).not.toContain('utm_');
    });

    it('converts HTTP to HTTPS', () => {
      const http = 'http://upload.wikimedia.org/wikipedia/commons/a/a4/Brihadeeswarar_Temple.jpg';
      expect(normalizeImageUrl(http)).toBe('https://upload.wikimedia.org/wikipedia/commons/a/a4/Brihadeeswarar_Temple.jpg');
    });

    it('converts thumb URL and strips UTM at the same time', () => {
      const thumb = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Five_Rathas.jpg/330px-Five_Rathas.jpg?utm_source=wiki';
      expect(normalizeImageUrl(thumb)).toBe('https://upload.wikimedia.org/wikipedia/commons/c/c2/Five_Rathas.jpg');
    });

    it('handles null, undefined, empty safely', () => {
      expect(normalizeImageUrl(null)).toBeNull();
      expect(normalizeImageUrl(undefined)).toBeNull();
      expect(normalizeImageUrl('')).toBeNull();
    });
  });

  describe('buildProxyUrl', () => {
    it('constructs correct backend image proxy URL', () => {
      const target = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/File.jpg';
      const proxy = buildProxyUrl(target);
      expect(proxy).toContain('/api/image-proxy?url=');
      expect(proxy).toContain(encodeURIComponent(target));
    });

    it('returns null when URL is empty', () => {
      expect(buildProxyUrl(null)).toBeNull();
      expect(buildProxyUrl('')).toBeNull();
    });
  });

  describe('resolveSiteImageUrl', () => {
    it('prioritises image_url over image', () => {
      const site = {
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Primary.jpg',
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Secondary.jpg',
      };
      expect(resolveSiteImageUrl(site)).toBe('https://upload.wikimedia.org/wikipedia/commons/1/11/Primary.jpg');
    });

    it('falls back to image when image_url is missing', () => {
      const site = {
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Secondary.jpg?utm_source=test',
      };
      expect(resolveSiteImageUrl(site)).toBe('https://upload.wikimedia.org/wikipedia/commons/2/22/Secondary.jpg');
    });
  });
});
