using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using DevExpress.XtraEditors;
using Ysr.Framework.Business.Common.Configuration;
using Ysr.Framework.Business.Common.DI;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.Model;
using Ysr.Framework.Business.Common.Service.Base;
using Ysr.Framework.Common.Global.Enums;
using Ysr.Framework.Common.Global.Helper;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class ReadingOpinionMaker
    {
        private static readonly IExpertService ExpertService = DependencyResolver.Get<IExpertService>();
        private static IEnumerable<Expert> _experts;

        private const int PageMaxHeight = 750;
        private const int PageTitleHeight = 120;

        public static string GetExamReadingOpinion(IEnumerable<ExamReport> examReports, Patient patient)
        {
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtml());
            htmlBuilder.Append(GetContentPages(examReports, patient));
            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        private static IEnumerable<ExamReport> CalcPrintHeight(IEnumerable<ExamReport> examReports)
        {
            var examReportList = examReports.ToList();

            const int fixedHeight = 60;
            const int minHeight = 15;
            var font = WindowsFormsSettings.DefaultFont;
            foreach (var examReport in examReportList)
            {
                var size = TextRenderer.MeasureText(examReport.TextResult, font, new Size(780, 0), TextFormatFlags.WordBreak);
                if (size.Height < minHeight) size.Height = minHeight;
                examReport.PrintHeight = size.Height + fixedHeight;
            }

            return examReportList;
        }

        private static IEnumerable<ExamReport> CalcPrintPageNumber(IEnumerable<ExamReport> examReports)
        {
            var examReportList = CalcPrintHeight(examReports).ToList();

            var totalHeight = PageTitleHeight;
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
            SetReadingDoctor();

            var htmlBuilder = new StringBuilder();

            var examReportList = CalcPrintPageNumber(examReports).ToList();
            var totalPageNum = examReportList.Max(r => r.PrintPageNumber);
            for (var pageNum = 1; pageNum <= totalPageNum; pageNum++)
            {
                var pageNumber = pageNum;
                var contentByPage = GetContentByPage(examReportList.Where(r => r.PrintPageNumber == pageNumber), patient, pageNum);
                htmlBuilder.Append(contentByPage);
            }

            return htmlBuilder.ToString();
        }

        private static string GetTitle(IEnumerable<ExamReport> examReports, Patient patient, int pageNum)
        {
            var examReport = examReports.FirstOrDefault() ?? new ExamReport();

            var title = pageNum == 1 ? $@"
            <table class=""table"">
                <tr>
                    <th>병원명</th>
                    <td colspan=""3"">{Meta.Hospital.Name}</td>
                </tr>
                <tr>
                    <th>내원일자</th>
                    <td colspan=""3"">{examReport.Date}</td>
                </tr>
                <tr>
                    <th>등록번호</th>
                    <td>{patient.PatientNo}</td>
                    <th>보험구분</th>
                    <td>{patient.UDept}</td>
                </tr>
                <tr>
                    <th>성명</th>
                    <td>{patient.Name}</td>
                    <th>연령 / 성별</th>
                    <td>{patient.Age}세 ({patient.Birthday:yyyy-MM-dd}) / {patient.Gender}</td>
                </tr>
                <tr>
                    <th>진료과</th>
                    <td>{GetSpecialSubject()}</td>
                    <th>의뢰의사</th>
                    <td>{Meta.LoginUser.Name}</td>
                </tr>
            </table>
            <div style=""font-size: 15px; margin-top: 20px; font-weight: bold;"">
                {GetTitleText(examReport)}
            </div>
            " : string.Empty;

            return title;
        }

        private static string GetContentByPage(IEnumerable<ExamReport> examReports, Patient patient, int pageNum)
        {
            var htmlBuilder = new StringBuilder();

            var examReportList = examReports.ToList();
            foreach (var examReport in examReportList)
            {
                var examReportHtml = $@"
                <div style=""margin-top: 25px; font-size: 15px;"">
                    <div>
                        <span style=""font-weight: bold;"">{examReport.ItemName}</span>
                        <span style=""float: right;"">{GetFilmNumber(examReport)}</span>
                    </div>
                    <div style=""margin-top: 7px;"">
                        <span style=""display: inline-block; width: 300px;"">판독의사: {GetReadingDoctorName(examReport)}</span>
                        <span>면허번호: {GetReadingDoctorLicense(examReport)}</span>
                    </div>
                    <div style=""margin-top: 5px;"">
                        <span style=""display: inline-block; width: 300px;"">[촬영일시] {examReport.ExamDate:yyyy-MM-dd HH:mm}</span>
                        <span>[판독일시] {examReport.ReadDate:yyyy-MM-dd HH:mm}</span>
                    </div>
                    <div style=""margin-top: 9px;"">
                        {examReport.TextResult.NewLineToBrTag()}
                    </div>
                </div>
                ";

                htmlBuilder.Append(examReportHtml);
            }

            var html = $@"
            <div class=""A4"">
                <div style=""padding: 20px;"">
                    {GetTitle(examReportList, patient, pageNum)}
                    {htmlBuilder}
                </div>
            </div>
            ";

            return html;
        }

        private static string GetFilmNumber(ExamReport examReport)
        {
            return examReport.Type == 검사구분Ui.방사선 && !string.IsNullOrEmpty(examReport.FilmNumber) ? $"[필름번호] {examReport.FilmNumber}" : string.Empty;
        }

        private static void SetReadingDoctor() => _experts = ExpertService.GetAll() ?? Enumerable.Empty<Expert>();

        private static string GetReadingDoctorName(ExamReport examReport)
        {
            var tmpLicense = examReport.Treatment.GetSutakCode().Tmpvarchar6;
            if (string.IsNullOrEmpty(tmpLicense)) return Meta.LoginUser.Name;

            return examReport.Type == 검사구분Ui.방사선
                ? _experts.Where(e => e.ExpertType == 전문의설정.방사선판독의 && e.ExpertLicenseNumber == tmpLicense).Select(e => e.ExpertName).FirstOrDefault()
                : _experts.Where(e => e.ExpertType == 전문의설정.초음파판독의 && e.ExpertLicenseNumber == tmpLicense).Select(e => e.ExpertName).FirstOrDefault();
        }

        private static string GetReadingDoctorLicense(ExamReport examReport)
        {
            var tmpLicense = examReport.Treatment.GetSutakCode().Tmpvarchar6;
            return string.IsNullOrEmpty(tmpLicense) ? Meta.LoginUser.LicenseId : tmpLicense;
        }

        private static string GetTitleText(ExamReport examReport)
        {
            return examReport.Type == 검사구분Ui.방사선 ? "[RADIOLOGICAL REPORT]" : "[ULTRASONOGRAPHY REPORT]";
        }

        private static string GetSpecialSubject()
        {
            var specialSubject = $"{Meta.LoginUser.SpecialSubject}";
            return specialSubject == "0" ? string.Empty : specialSubject;
        }
    }
}
