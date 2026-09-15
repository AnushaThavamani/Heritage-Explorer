import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ title: 'Test site', extract: 'Test summary', thumbnail: { source: 'https://upload.wikimedia.org/test.jpg' }, content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Test' } } }),
  }));
  let renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await new Promise(resolve => setImmediate(resolve));
  });
  ReactTestRenderer.act(() => renderer.unmount());
});
