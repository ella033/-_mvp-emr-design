using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.Model;
using Ysr.Framework.Common.Global.Constant;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class SpecificPrescriptionMaker
    {
        private const int PageMaxHeight = 570 * 2;
        private const int RowHeight = 15;

        public static string GetSpecificPrescription(IEnumerable<SpecificPrescription> specificPrescriptions, DateTime begin, DateTime end, string mergedFilterText)
        {
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtml());
            htmlBuilder.Append(GetContentPages(specificPrescriptions, begin, end, mergedFilterText));
            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        private static IEnumerable<SpecificPrescription> CalcPrintPageNumber(IEnumerable<SpecificPrescription> specificPrescriptions)
        {
            var specificPrescriptionList = specificPrescriptions.ToList();

            var totalHeight = 0;
            var pageNumber = 1;
            foreach (var specificPrescription in specificPrescriptionList)
            {
                totalHeight += RowHeight;
                if (totalHeight > PageMaxHeight)
                {
                    pageNumber += 1;
                    totalHeight = RowHeight;
                }

                specificPrescription.PrintPageNumber = pageNumber;
            }

            return specificPrescriptionList;
        }

        private static string GetContentPages(IEnumerable<SpecificPrescription> specificPrescriptions, DateTime begin, DateTime end, string mergedFilterText)
        {
            var htmlBuilder = new StringBuilder();

            var specificPrescriptionList = CalcPrintPageNumber(specificPrescriptions).ToList();
            var totalPageNum = specificPrescriptionList.Max(sp => sp.PrintPageNumber);
            for (var pageNum = 1; pageNum <= totalPageNum; pageNum++)
            {
                var pageNumber = pageNum;
                var contentByPage = GetContentByPage(specificPrescriptionList.Where(r => r.PrintPageNumber == pageNumber));
                htmlBuilder.Append(GetContentPage(pageNumber, contentByPage, begin, end, mergedFilterText));
            }

            return htmlBuilder.ToString();
        }

        private static string GetContentPage(int pageNum, string contentByPage, DateTime begin, DateTime end, string mergedFilterText)
        {
            var html = $@"
            <div class=""A4"">
                <div style=""font-size: 28px; margin-bottom: 15px; padding-top: 20px; text-align: center;"">
                    특정처방, 병명 조회결과
                </div>
                <div style=""font-size: 14px; padding-bottom: 5px; margin-bottom: 20px; text-align: center;"">
                    (조회기간 : {begin.Year}년 {begin.Month}월 {begin.Day}일 ~ {end.Year}년 {end.Month}월 {end.Day}일)
                </div>
                <div style=""font-size: 16px; margin: 10px 20px 10px 20px; "">
                    <div style=""display: inline-block; max-width: 600px;"">{mergedFilterText}</div>
                    <div style=""float: right; display: inline-block;"">{DateTime.Now:yyyy-MM-dd HH:mm:ss}</div>
                </div>
                {contentByPage}
                <div class=""paper-tail"">
                    <div style=""border-top: solid; border-width: 1px; padding: 5px; text-align: right; margin: 25px; "">
                        <span>Page: {pageNum}</span>
                    </div>
                </div>
            </div>
            ";

            return html;
        }

        private static string GetContentByPage(IEnumerable<SpecificPrescription> specificPrescriptions)
        {
            var specificPrescriptionsLeft = new List<SpecificPrescription>();
            var specificPrescriptionsRight = new List<SpecificPrescription>();

            var specificPrescriptionList = specificPrescriptions.ToList();
            for (var i = 0; i < specificPrescriptionList.Count; i++)
            {
                if (i % Constants.Numbers.Half == 0)
                {
                    specificPrescriptionsLeft.Add(specificPrescriptionList[i]);
                }
                else
                {
                    specificPrescriptionsRight.Add(specificPrescriptionList[i]);
                }
            }

            var html = $@"
            <div style=""float: left; width: 99mm; margin-left: 20px;"">
                <table class=""table"">
                    <tr>
                        <th>차트번호</th>
                        <th>수진자명</th>
                        <th>주민번호</th>
                        <th>접수일</th>
                        <th>진료의</th>
                    </tr>
                    {GetContentTable(specificPrescriptionsLeft)}
                </table>
            </div>
            <div style=""float: right; width: 99mm; margin-right: 20px;"">
                <table class=""table"">
                    <tr>
                        <th>차트번호</th>
                        <th>수진자명</th>
                        <th>주민번호</th>
                        <th>접수일</th>
                        <th>진료의</th>
                    </tr>
                    {GetContentTable(specificPrescriptionsRight)}
                </table>
            </div>
            ";

            return html;
        }

        private static string GetContentTable(IEnumerable<SpecificPrescription> specificPrescriptions)
        {
            var htmlBuilder = new StringBuilder();

            foreach (var specificPrescription in specificPrescriptions)
            {
                var html = $@"
                <tr style=""font-size: 12px;"">
                    <td>{specificPrescription.Encounter.PatientNo}</td>
                    <td><div style=""overflow: hidden; max-height: 17px; max-width: 60px;"">{specificPrescription.Patient.Name}</div></td>
                    <td>{specificPrescription.Patient.ResidentRegistrationNumber}</td>
                    <td>{specificPrescription.Encounter.EncounterDate:yyyy-MM-dd}</td>
                    <td>{specificPrescription.Encounter.DoctorUserId}</td>
                </tr>
                ";

                htmlBuilder.Append(html);
            }

            return htmlBuilder.ToString();
        }
    }
}
