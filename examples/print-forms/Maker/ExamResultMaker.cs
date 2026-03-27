using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using DevExpress.XtraEditors;
using UBcare.Ysr.Checkup.UcCheckupViewer.Common.Helper;
using Ysr.Framework.Business.Common.Configuration;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.Model;
using Ysr.Framework.Common.Global.Constant;
using Ysr.Framework.Common.Global.Enums;
using Ysr.Framework.Common.Global.Helper;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class ExamResultMaker
    {
        private const int PageMaxHeight = 500;
        private const int NextExamDateHeight = 90;

        public static string GetExamResult(IEnumerable<ExamReport> examReports, Patient patient)
        {
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtml());

            var examReportList = examReports.ToList();
            var isShowCover = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamTitlePage).Value.ToBool();
            if (isShowCover) htmlBuilder.Append(GetCoverPage(examReportList, patient));
            htmlBuilder.Append(GetContentPages(examReportList, patient));

            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        private static IEnumerable<ExamReport> CalcPrintHeight(IEnumerable<ExamReport> examReports)
        {
            var examReportList = examReports.ToList();

            const int rowHeight병리 = 15;
            var examReportList병리 = examReportList.Where(r => r.Type == 검사구분Ui.병리).ToList();
            var date = string.Empty;
            // 병리검사 결과 RowHeight 15로 셋팅(단, 날짜가 변경되는경우 날짜RowHeight 15를 더 더해준다)
            foreach (var examReport in examReportList병리)
            {
                var dateHeight = 0;
                if (date != examReport.Date)
                {
                    date = examReport.Date;
                    dateHeight = rowHeight병리;
                }
                examReport.PrintHeight = rowHeight병리 + dateHeight;
            }

            const int gap = 30;
            const int minHeight = 15;
            var font = WindowsFormsSettings.DefaultFont;
            var examReportList병리외 = examReportList.Where(r => r.Type != 검사구분Ui.병리).ToList();
            foreach (var examReport in examReportList병리외)
            {
                var size = TextRenderer.MeasureText(examReport.TextResult, font, new Size(780, 0), TextFormatFlags.WordBreak);
                if (size.Height < minHeight) size.Height = minHeight;
                examReport.PrintHeight = size.Height + gap;
            }

            return examReportList;
        }

        private static IEnumerable<ExamReport> CalcPrintPageNumber(IEnumerable<ExamReport> examReports)
        {
            var examReportList = new List<ExamReport>();
            var examReportListAfterCalcPrintHeight = CalcPrintHeight(examReports).ToList();
            var examReportList병리 = examReportListAfterCalcPrintHeight.Where(r => r.Type == 검사구분Ui.병리).OrderBy(r => r.Date).ToList();
            var examReportList병리외 = examReportListAfterCalcPrintHeight.Where(r => r.Type != 검사구분Ui.병리).OrderBy(r => r.Date).ToList();

            examReportList.AddRange(examReportList병리);
            examReportList.AddRange(examReportList병리외);

            var totalHeight = 0;
            var pageNumber = 1;
            foreach (var examReport in examReportList)
            {
                totalHeight += examReport.PrintHeight;
                if (totalHeight > PageMaxHeight)
                {
                    pageNumber += 1;
                    totalHeight = examReport.PrintHeight;
                }

                examReport.PrintPageNumber = pageNumber;
            }

            return examReportList;
        }

        private static string GetContentPages(IEnumerable<ExamReport> examReports, Patient patient)
        {
            var htmlBuilder = new StringBuilder();

            var examReportList = CalcPrintPageNumber(examReports).ToList();
            var totalPageNum = examReportList.Max(r => r.PrintPageNumber);
            for (var pageNum = 1; pageNum <= totalPageNum; pageNum++)
            {
                var pageNumber = pageNum;
                var contentByPage = GetContentByPage(examReportList.Where(r => r.PrintPageNumber == pageNumber), patient, pageNum, totalPageNum);
                htmlBuilder.Append(GetContentPage(patient, pageNumber, contentByPage));
            }

            var isPrintExamNextDate = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamNextDate).Value.ToBool();
            var isAvailableInNextPage = examReportList.Where(r => r.PrintPageNumber == totalPageNum).Sum(r => r.PrintHeight) + NextExamDateHeight >= PageMaxHeight;
            if (isPrintExamNextDate && isAvailableInNextPage)
            {
                var contentPage = GetContentPage(patient, totalPageNum + 1, GetNextExamDate(patient));
                htmlBuilder.Append(contentPage);
            }

            return htmlBuilder.ToString();
        }

        private static string GetContentPage(Patient patient, int pageNum, string contentByPage)
        {
            var html = $@"
            <div class=""A4"">
                <div style=""padding: 20px;"">
                    <div style=""font-size: 25px; margin-bottom: 15px;"">
                        {Get병원로고()} {Meta.Hospital.Name}
                    </div>
                    <div style=""border-bottom: solid; border-width: 2px; font-size: 15px; padding-bottom: 5px; margin-bottom: 20px;"">
                        ""{patient.Name}({patient.PatientId})"" 님의 &nbsp; 건강진단결과, &nbsp; 성별: {patient.Gender}, &nbsp; 연령: {patient.Age}
                    </div>
                    {contentByPage}
                </div>
                <div class=""paper-tail"">
                    <div style=""border-top: solid; border-width: 1px; padding: 5px; margin: 25px;"">
                        <div style=""margin-bottom: 5px;"">
                            <span>
                                발급일: {DateTime.Now:yyyy-MM-dd} &nbsp;&nbsp;&nbsp; 
                                발급처: {Meta.Hospital.Name} &nbsp;&nbsp;&nbsp; 
                                담당의: {Meta.LoginUser.Name} &nbsp;&nbsp;&nbsp; 
                                Tel.: {Meta.Hospital.Telephone}
                            </span>
                        </div>
                        <span>Page: {pageNum}</span>
                    </div>
                </div>
            </div>
            ";

            return html;
        }

        private static string GetContentByPage(IEnumerable<ExamReport> examReports, Patient patient, int pageNum, int totalPageNum)
        {
            var htmlBuilder = new StringBuilder();

            var examReportList = examReports.ToList();
            if (examReportList.Any(r => r.Type == 검사구분Ui.병리))
            {
                htmlBuilder.Append(Get병리검사(examReportList.Where(r => r.Type == 검사구분Ui.병리), patient));
            }

            if (examReportList.Any(r => r.Type != 검사구분Ui.병리))
            {
                htmlBuilder.Append(Get병리검사외(examReportList.Where(r => r.Type != 검사구분Ui.병리)));
            }

            var isPrintExamNextDate = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamNextDate).Value.ToBool();
            var isAvailableInThisPage = examReportList.Sum(r => r.PrintHeight) + NextExamDateHeight < PageMaxHeight;
            if (pageNum == totalPageNum && isPrintExamNextDate && isAvailableInThisPage)
            {
                htmlBuilder.Append(GetNextExamDate(patient));
            }

            return htmlBuilder.ToString();
        }

        private static string GetNextExamDate(Patient patient)
        {
            var examNextMonth = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamNextMonth).Value.StringNumberToInt();
            var examNextDate = DateTime.Now.AddMonths(examNextMonth);

            var html = $@"
			<br /><br /><br />
            <div style=""font-size: 16px;"">
                <span style=""float: right; margin-right: 20px;"">
                    {patient.Name}님의 다음 종합건강진단 예정일은 {examNextDate.Year}년 {examNextDate.Month}월 {examNextDate.Day}일 입니다.<br />
                    검사 결과 및 상담은 (전화:{Meta.Hospital.Telephone})로 문의하여 주시기 바랍니다.
                </span>
            </div>
            ";

            return html;
        }

        private static string Get병리검사(IEnumerable<ExamReport> examReports, Patient patient)
        {
            var htmlBuilder = new StringBuilder();

            var examReportList = examReports.ToList();
            var dates = GetDates(examReportList).ToList();
            var is결과값없는경우결과지첨부표시 = Meta.GetOption(Constants.FOptionKeys.결과값없는경우결과지첨부표시).Value.ToBool();
            var printReferDisease = (Meta.GetOption(Constants.FOptionKeys.PrintConfig.PrintExamReferDiseaseComment)?.Value ?? "1").ToBool();

            foreach (var date in dates)
            {
                var examDate = date.ToDate();
                var dateHtml = $@"
                <tr>
                    <td colspan=""5"">[{examDate.Year}년 {examDate.Month}월 {examDate.Day}일 검사]</td>
                </tr>
                ";

                htmlBuilder.Append(dateHtml);

                foreach (var examReport in examReportList.Where(r => r.Date == date))
                {
                    var result = is결과값없는경우결과지첨부표시 && string.IsNullOrWhiteSpace(examReport.Result) ? "결과지 첨부" : examReport.Result;
                    var referDiseaseComment = printReferDisease ? $"<td>{examReport.ExamCode?.ReferDiseaseComment}</td>" : string.Empty;
                    var examHtml = $@"
                    <tr>
                        <td>{examReport.ItemName}</td>
                        <td>{examReport.GetReference(patient)}</td>
                        {referDiseaseComment}
                        <td>{result}</td>
                        <td>{examReport.ExamCode?.ReferUnit}</td>
                    </tr>
                    ";

                    htmlBuilder.Append(examHtml);
                }
            }

            var referDiseaseCommentHeader = printReferDisease ? "<th>관련질병</th>" : string.Empty;

            var html = $@"
            <table class=""table"">
                <tr>
                    <th>검사명칭</th>
                    <th>참조치</th>
                    {referDiseaseCommentHeader}
                    <th>검사결과</th>
                    <th>단위</th>
                </tr>
			    {htmlBuilder}
            </table>
            ";

            return html;
        }

        private static string Get병리검사외(IEnumerable<ExamReport> examReports)
        {
            var htmlBuilder = new StringBuilder();

            var fontSize = GetExamFontSize();
            var is결과값없는경우결과지첨부표시 = Meta.GetOption(Constants.FOptionKeys.결과값없는경우결과지첨부표시).Value.ToBool();

            foreach (var examReport in examReports)
            {
                var examDate = examReport.Date.ToDate();
                var textResult = is결과값없는경우결과지첨부표시 && string.IsNullOrWhiteSpace(examReport.TextResult) ? "결과지 첨부" : examReport.TextResult;

                var html = $@"
			    <br />
                <div class=""exam-report-title"">{examReport.ItemName} [{examDate.Year}년 {examDate.Month}월 {examDate.Day}일 검사]</div>
                <div class=""exam-report-content"" style=""font-size: {fontSize}pt;"">{textResult.NewLineToBrTag()}</div>
                ";

                htmlBuilder.Append(html);
            }

            return htmlBuilder.ToString();
        }

        private static string GetExamFontSize()
        {
            var fontSize = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamFontSize).Value;
            return string.IsNullOrEmpty(fontSize) ? "11" : fontSize;
        }

        private static string GetCoverPage(IEnumerable<ExamReport> examReports, Patient patient)
        {
            var coverTitle = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamTitle).Value;
            var coverMessage = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamMessage).Value;
            var coverColor = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamColor).Value.ToInt().GetHtmlColorFromWin32Color();

            var html = $@"
            <div class=""A4"">
                <div style=""padding: 20px;"">
                    <div style=""border-style: solid; border-width: 1px; padding: 15px; background-color: {coverColor};"">
                        <div style=""font-size: 45px; margin-bottom: 50px; text-align: center;"">{coverTitle}</div>
                        <div>{coverMessage}</div>
                    </div>
                    <div class=""exam-report-cover-title-div"" style=""padding-top: 20px;"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 차트번호: </span>
                        <span class=""exam-report-cover-title-content"">{patient.PatientId}</span>
                    </div>
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명: </span>
                        <span class=""exam-report-cover-title-content"">{patient.Name}</span>
                    </div>
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 주민번호: </span>
                        <span class=""exam-report-cover-title-content"">{Get환자주민번호(patient)}</span>
                    </div>
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;별: </span>
                        <span class=""exam-report-cover-title-content"">{patient.Gender}</span>
                    </div>
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 연&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;령: </span>
                        <span class=""exam-report-cover-title-content"">만 {patient.Age} 세</span>
                    </div>
                    {Get검진일자(examReports)}
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 전&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;화: </span>
                        <span class=""exam-report-cover-title-content"">{Get환자전화번호(patient).GetPhoneNumberFormat()}</span>
                    </div>
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소: </span>
                        <span class=""exam-report-cover-title-content"">
                            {patient.Address}
                        </span>
                    </div>
                    <div style=""padding-left: 145px; padding-top: 9px;"">
                        <span class=""exam-report-cover-title-content"">
                            &nbsp;
                        </span>
                    </div>
                </div>
                <div class=""paper-tail"" style=""bottom: 70px;"">
                    {Get병원로고()}
                    <span style=""font-size: 45px;"">{Meta.Hospital.Name}</span>
                </div>
            </div>
            ";

            return html;
        }

        private static string Get환자주민번호(Patient patient)
        {
            var isPrintRegiNumberMasking = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamPregiMasking).Value.ToBool();
            return isPrintRegiNumberMasking ? patient.MaskedResidentRegistrationNumber : patient.ResidentRegistrationNumber;
        }

        private static string Get환자전화번호(Patient patient)
        {
            return !string.IsNullOrEmpty(patient.Mobile) ? patient.Mobile : patient.Telephone;
        }

        private static IEnumerable<string> GetDates(IEnumerable<ExamReport> examReports)
        {
            return examReports.OrderBy(r => r.Date).GroupBy(e => new { e.Date }).Select(g => g.Key.Date).ToList();
        }

        private static string Get검진일자(IEnumerable<ExamReport> examReports)
        {
            var dates = GetDates(examReports).ToList();
            const int showLineCount = 4;

            var htmlBuilder = new StringBuilder();

            var loopCnt = (dates.Count - 1) / showLineCount + 1;
            for (var i = 0; i < loopCnt; i++)
            {
                var startIdx = showLineCount * i;
                var date0 = dates.Count > startIdx + 0 ? $@"{dates[startIdx + 0]}" : string.Empty;
                var date1 = dates.Count > startIdx + 1 ? $@", &nbsp; {dates[startIdx + 1]}" : string.Empty;
                var date2 = dates.Count > startIdx + 2 ? $@", &nbsp; {dates[startIdx + 2]}" : string.Empty;
                var date3 = dates.Count > startIdx + 3 ? $@", &nbsp; {dates[startIdx + 3]}" : string.Empty;
                var date = $@"{date0}{date1}{date2}{date3}";

                var html = i == 0 ?
                    $@"
                    <div class=""exam-report-cover-title-div"">
                        <span class=""exam-report-cover-title""><span class=""exam-report-cover-title-bullet"">●</span> 검진일자: </span>
                        <span class=""exam-report-cover-title-content"">
                            {date}
                        </span>
                    </div>
                    "
                    :
                    $@"
                    <div style=""padding-left: 145px; padding-top: 9px;"">
                        <span class=""exam-report-cover-title-content"">
                            {date}
                        </span>
                    </div>
                    ";

                htmlBuilder.Append(html);
            }

            return htmlBuilder.ToString();
        }

        private static string Get병원로고()
        {
            try
            {
                var isPrintHospitalLogo = Meta.GetOption(Constants.FOptionKeys.PrintConfig.ExamCrossPrint).Value.ToBool();
                if (!isPrintHospitalLogo) return string.Empty;

                var logoImage = Convert.ToBase64String(Meta.Hospital.LogoImage);
                return string.IsNullOrWhiteSpace(logoImage) ? string.Empty
                    : $@"<img src=""data:image/jpg;base64, {logoImage}"" alt=""logo"" class=""exam-logo"" />";
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }
    }
}
