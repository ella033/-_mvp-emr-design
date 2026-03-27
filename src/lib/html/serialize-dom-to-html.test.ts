import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  serializeDomFragmentToHtml,
  convertCanvasesToImages,
} from './serialize-dom-to-html';

// fetch를 mock하여 inlineImages/inlineBackgroundImages가 실패 없이 진행되도록 함
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
    }),
  );
});

describe('convertCanvasesToImages', () => {
  it('source canvas의 toDataURL 결과가 clone의 img.src로 반영된다', () => {
    // source: 실제 canvas pixel data가 있는 것처럼 toDataURL mock
    const source = document.createElement('div');
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = 100;
    sourceCanvas.height = 200;
    sourceCanvas.style.cssText = 'width: 50px; height: 100px;';
    // toDataURL mock
    vi.spyOn(sourceCanvas, 'toDataURL').mockReturnValue('data:image/png;base64,ABCD');
    source.appendChild(sourceCanvas);

    // clone: cloneNode 시뮬레이션
    const clone = source.cloneNode(true) as HTMLElement;

    convertCanvasesToImages(source, clone);

    // clone의 canvas가 img로 대체되었는지 확인
    const canvases = clone.querySelectorAll('canvas');
    expect(canvases.length).toBe(0);

    const imgs = clone.querySelectorAll('img');
    expect(imgs.length).toBe(1);

    const img = imgs[0]!;
    expect(img.src).toBe('data:image/png;base64,ABCD');
    expect(img.width).toBe(100);
    expect(img.height).toBe(200);
    expect(img.style.display).toBe('block');
    // canvas의 인라인 스타일이 복사되었는지
    expect(img.style.cssText).toContain('width');
  });

  it('canvas가 없으면 아무 변환 없이 통과한다', () => {
    const source = document.createElement('div');
    source.innerHTML = '<p>텍스트만</p>';
    const clone = source.cloneNode(true) as HTMLElement;

    // 에러 없이 완료
    convertCanvasesToImages(source, clone);

    expect(clone.querySelectorAll('canvas').length).toBe(0);
    expect(clone.querySelectorAll('img').length).toBe(0);
    expect(clone.innerHTML).toBe('<p>텍스트만</p>');
  });

  it('toDataURL 실패(CORS) 시 원본 canvas를 유지한다', () => {
    const source = document.createElement('div');
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = 100;
    sourceCanvas.height = 200;
    vi.spyOn(sourceCanvas, 'toDataURL').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    source.appendChild(sourceCanvas);

    const clone = source.cloneNode(true) as HTMLElement;

    convertCanvasesToImages(source, clone);

    // canvas가 그대로 유지
    expect(clone.querySelectorAll('canvas').length).toBe(1);
    expect(clone.querySelectorAll('img').length).toBe(0);
  });

  it('여러 canvas를 모두 변환한다', () => {
    const source = document.createElement('div');

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 100 + i;
      canvas.height = 200 + i;
      vi.spyOn(canvas, 'toDataURL').mockReturnValue(`data:image/png;base64,IMG${i}`);
      source.appendChild(canvas);
    }

    const clone = source.cloneNode(true) as HTMLElement;

    convertCanvasesToImages(source, clone);

    expect(clone.querySelectorAll('canvas').length).toBe(0);
    const imgs = clone.querySelectorAll('img');
    expect(imgs.length).toBe(3);
    expect(imgs[0]!.src).toBe('data:image/png;base64,IMG0');
    expect(imgs[1]!.src).toBe('data:image/png;base64,IMG1');
    expect(imgs[2]!.src).toBe('data:image/png;base64,IMG2');
  });
});

describe('serializeDomFragmentToHtml', () => {
  it('canvas→img 변환 + form 값 동기화가 포함된 HTML을 반환한다', async () => {
    const source = document.createElement('div');
    source.setAttribute('data-client-pdf-root', 'true');
    source.style.position = 'relative';
    source.style.backgroundColor = 'white';

    // canvas 추가
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 200;
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,TEST');
    source.appendChild(canvas);

    // input 추가 (form 값 동기화 검증)
    const input = document.createElement('input');
    input.type = 'text';
    input.value = '테스트값';
    source.appendChild(input);

    const html = await serializeDomFragmentToHtml({ source });

    // canvas가 img로 변환됨
    expect(html).toContain('data:image/png;base64,TEST');
    expect(html).not.toContain('<canvas');

    // input value가 attribute로 동기화됨
    expect(html).toContain('value="테스트값"');
  });

  it('script 태그가 제거된다', async () => {
    const source = document.createElement('div');
    source.innerHTML = '<p>content</p><script>alert("xss")</script>';

    const html = await serializeDomFragmentToHtml({ source });

    expect(html).not.toContain('<script');
    expect(html).toContain('<p>content</p>');
  });

  it('source DOM은 변경되지 않는다', async () => {
    const source = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,X');
    source.appendChild(canvas);

    const originalHtml = source.innerHTML;

    await serializeDomFragmentToHtml({ source });

    // source DOM은 변경되지 않음
    expect(source.innerHTML).toBe(originalHtml);
    expect(source.querySelectorAll('canvas').length).toBe(1);
  });
});
