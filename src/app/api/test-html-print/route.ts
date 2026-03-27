import { NextResponse } from "next/server";

/**
 * GET /api/test-html-print
 * A4 2페이지 테스트 HTML을 반환합니다.
 * Agent가 contentUrl로 이 URL을 다운로드하여 WebView2에서 인쇄합니다.
 */
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>HTML Print Test - A4 2 Pages</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      font-size: 14px;
      color: #333;
    }
    .page {
      width: 210mm;
      min-height: 257mm;
      padding: 20mm;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p {
      font-size: 12px;
      color: #666;
    }
    .content {
      line-height: 1.8;
    }
    .content h2 {
      font-size: 18px;
      margin: 15px 0 10px;
      color: #1a1a1a;
    }
    .content p {
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .badge {
      display: inline-block;
      background: #4CAF50;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>

  <!-- Page 1 -->
  <div class="page">
    <div class="header">
      <h1>NextEMR HTML 인쇄 테스트</h1>
      <p>WebView2 Print Test - Page 1 of 2</p>
      <p>생성 시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
    </div>
    <div class="content">
      <h2>1. 테스트 목적</h2>
      <p>이 문서는 NextEmr Agent의 <span class="badge">WebView2 HTML 인쇄</span> 기능을 검증하기 위한 테스트 페이지입니다.</p>
      <p>contentType이 <code>text/html</code>인 인쇄 작업이 WebSocket을 통해 Agent로 전달되면, Agent는 WebView2를 이용하여 HTML을 렌더링한 후 지정된 프린터로 출력합니다.</p>

      <h2>2. 테스트 항목</h2>
      <table>
        <thead>
          <tr>
            <th>항목</th>
            <th>설명</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTML 렌더링</td>
            <td>WebView2에서 HTML이 정상적으로 렌더링되는지 확인</td>
            <td><span class="badge">테스트 중</span></td>
          </tr>
          <tr>
            <td>CSS 스타일</td>
            <td>폰트, 테이블, 레이아웃 등 CSS 스타일 적용 확인</td>
            <td><span class="badge">테스트 중</span></td>
          </tr>
          <tr>
            <td>A4 페이지 크기</td>
            <td>@page 규칙에 따른 A4 크기 출력 확인</td>
            <td><span class="badge">테스트 중</span></td>
          </tr>
          <tr>
            <td>페이지 나눔</td>
            <td>page-break-after로 2페이지 분리 확인</td>
            <td><span class="badge">테스트 중</span></td>
          </tr>
          <tr>
            <td>프린터 지정</td>
            <td>job 데이터의 프린터 이름으로 출력 확인</td>
            <td><span class="badge">테스트 중</span></td>
          </tr>
        </tbody>
      </table>

      <h2>3. 기술 사양</h2>
      <table>
        <tr><th>항목</th><th>값</th></tr>
        <tr><td>인쇄 방식</td><td>WebView2 CoreWebView2.PrintAsync()</td></tr>
        <tr><td>콘텐츠 전달</td><td>contentUrl (HTTP GET)</td></tr>
        <tr><td>페이지 크기</td><td>A4 (210mm x 297mm)</td></tr>
        <tr><td>페이지 수</td><td>2</td></tr>
        <tr><td>프린터 선택</td><td>서버 지정 (DEFAULT_PRINTER)</td></tr>
      </table>
    </div>
    <div class="footer">
      NextEMR Agent HTML Print Test - Page 1 / 2
    </div>
  </div>

  <!-- Page 2 -->
  <div class="page">
    <div class="header">
      <h1>NextEMR HTML 인쇄 테스트</h1>
      <p>WebView2 Print Test - Page 2 of 2</p>
    </div>
    <div class="content">
      <h2>4. 환자 정보 샘플 (테스트 데이터)</h2>
      <table>
        <thead>
          <tr>
            <th>환자번호</th>
            <th>성명</th>
            <th>생년월일</th>
            <th>진료과</th>
            <th>담당의</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>P-2024-0001</td><td>홍길동</td><td>1985-03-15</td><td>내과</td><td>김의사</td></tr>
          <tr><td>P-2024-0002</td><td>이영희</td><td>1990-07-22</td><td>외과</td><td>박의사</td></tr>
          <tr><td>P-2024-0003</td><td>박철수</td><td>1978-11-08</td><td>정형외과</td><td>최의사</td></tr>
          <tr><td>P-2024-0004</td><td>김미나</td><td>1995-01-30</td><td>피부과</td><td>정의사</td></tr>
          <tr><td>P-2024-0005</td><td>정대한</td><td>1982-06-12</td><td>이비인후과</td><td>강의사</td></tr>
        </tbody>
      </table>

      <h2>5. 처방 내역 샘플</h2>
      <table>
        <thead>
          <tr>
            <th>약품코드</th>
            <th>약품명</th>
            <th>용법</th>
            <th>투여량</th>
            <th>일수</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>D001</td><td>아목시실린 500mg</td><td>1일 3회 식후</td><td>1정</td><td>7일</td></tr>
          <tr><td>D002</td><td>이부프로펜 400mg</td><td>1일 2회 식후</td><td>1정</td><td>5일</td></tr>
          <tr><td>D003</td><td>오메프라졸 20mg</td><td>1일 1회 식전</td><td>1캡슐</td><td>14일</td></tr>
          <tr><td>D004</td><td>로라타딘 10mg</td><td>1일 1회</td><td>1정</td><td>7일</td></tr>
        </tbody>
      </table>

      <h2>6. 출력 확인</h2>
      <p>이 페이지가 정상적으로 출력되었다면, 다음 사항이 확인된 것입니다:</p>
      <ul style="margin-left: 20px; line-height: 2;">
        <li>WebView2 HTML 렌더링 정상 동작</li>
        <li>A4 용지 크기 인쇄 정상 동작</li>
        <li>2페이지 분리 (page-break) 정상 동작</li>
        <li>한글 폰트 렌더링 정상 동작</li>
        <li>테이블 및 CSS 스타일 정상 적용</li>
        <li>프린터 지정 출력 정상 동작</li>
      </ul>
    </div>
    <div class="footer">
      NextEMR Agent HTML Print Test - Page 2 / 2
    </div>
  </div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
