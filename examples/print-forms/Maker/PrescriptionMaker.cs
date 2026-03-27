using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Ysr.Framework.Business.Common.Configuration;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.ExternalLinkage;
using Ysr.Framework.Business.Common.Helper;
using Ysr.Framework.Business.Common.Model;
using Ysr.Framework.Business.Common.Model.Print;
using Ysr.Framework.Business.Common.Util;
using Ysr.Framework.Common.Global.Constant;
using Ysr.Framework.Common.Global.Enums;
using Ysr.Framework.Common.Global.Helper;
using Ysr.Framework.Common.Ysr.Util;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class PrescriptionMaker
    {
        private const int MaxLength원외약 = 13;
        private const int MaxLength주사제 = 7;

        public static string GetStyle원외처방전양식지(bool isPreview = false)
        {
            return MetaOptionHelper.Get출력방법() == 출력방법.원외처방전양식지 && !isPreview ? @"
                <style>
                    .table2 td {
                        border: 1px solid transparent;
                    }

                    .opacity-zero {
                        opacity: 0;
                    }
                </style>
            " : string.Empty;
        }

        public static string GetRePrescription(ChartInfo chartInfo, string purpose)
        {
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtml(GetStyle원외처방전양식지()));

            var prescription = new PrescriptionInfo(chartInfo);
            var totalPage = GetPrescriptionTotalPage(prescription);

            for (var pageNum = 1; pageNum <= totalPage; pageNum++)
            {
                htmlBuilder.Append(GetPrescriptionHtml(prescription, pageNum, purpose));
            }

            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        public static string GetPrescription(ChartInfo chartInfo, bool isPreview)
        {
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtml(GetStyle원외처방전양식지(isPreview)));

            var prescription = new PrescriptionInfo(chartInfo) { IsPreview = isPreview };
            var totalPage = GetPrescriptionTotalPage(prescription);
            var printCountTemp = prescription.GetPrintCount();

            for (var printCount = 0; printCount < printCountTemp; printCount++)
            {
                string purpose;
                switch (printCount)
                {
                    case 0:
                        purpose = "약국제출용";
                        break;
                    case 1:
                        purpose = "환자보관용";
                        break;
                    default:
                        purpose = string.Empty;
                        break;
                }

                for (var pageNum = 1; pageNum <= totalPage; pageNum++)
                {
                    htmlBuilder.Append(GetPrescriptionHtml(prescription, pageNum, purpose));
                }
            }

            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        private static PrescriptionItem Get원외약(PrescriptionInfo prescription, int pageNum, int seq)
        {
            var isPrintSpace = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintSpace).Value.ToBool();
            var items = prescription.원외약품List;

            var startIdx = (pageNum - 1) * MaxLength원외약;
            var ordNum = startIdx + seq;

            if (isPrintSpace && ordNum == items.Count + 1)
            {
                return new PrescriptionItem(null)
                {
                    IsDummy = true,
                    KoreanName = "============ 이 하 여 백 ============",
                    EnglishName = "============ 이 하 여 백 ============",
                    NameAlign = "text-center"
                };
            }

            if (ordNum > items.Count)
            {
                return new PrescriptionItem(null)
                {
                    IsDummy = true,
                    KoreanName = string.Empty,
                    EnglishName = string.Empty
                };
            }

            return items[ordNum - 1];
        }

        private static List<PrescriptionItem> Get원외약Prescriptions(PrescriptionInfo prescription, int pageNum)
        {
            var prescriptions = new List<PrescriptionItem>();
            for (var seq = 1; seq <= MaxLength원외약; seq++) prescriptions.Add(Get원외약(prescription, pageNum, seq));

            return prescriptions;
        }

        private static List<PrescriptionItem> Get주사제Prescriptions(PrescriptionInfo prescription, int pageNum)
        {
            var prescriptions = new List<PrescriptionItem>();
            for (var seq = 1; seq <= MaxLength주사제; seq++) prescriptions.Add(Get주사제(prescription, pageNum, seq));

            return prescriptions;
        }

        private static bool Has주사제By원내외구분(PrescriptionInfo prescription, 원내외구분 원내외구분)
            => prescription.주사약품List.Any(x => x.원내구분 == 원내외구분);

        private static PrescriptionItem Get주사제(PrescriptionInfo prescription, int pageNum, int seq)
        {
            var treatments = prescription.주사약품List;
            
            var startIdx = (pageNum - 1) * MaxLength주사제;
            var ordNum = startIdx + seq;

            if (ordNum > treatments.Count)
            {
                return new PrescriptionItem(null)
                {
                    IsDummy = true,
                    KoreanName = string.Empty,
                    EnglishName = string.Empty,
                };
            }

            return treatments[ordNum - 1];
        }

        private static int GetPrescriptionTotalPage(PrescriptionInfo prescription)
        {
            var totalPage원외약 = (prescription.원외약품List.Count - 1) / Constants.처방전.원외약페이지당개수 + 1;
            var totalPage주사제 = (prescription.주사약품List.Count - 1) / Constants.처방전.주사제페이지당개수 + 1;

            return Math.Max(totalPage원외약, totalPage주사제);
        }

        private static string GetPrescriptionHtml(PrescriptionInfo prescription, int pageNum, string purpose)
        {
            if (prescription.IsNull()) return string.Empty;

            var purposeStr = string.IsNullOrEmpty(purpose) ? string.Empty : $"({purpose})";

            var body = $@"
                <div class=""A4"">
                    <div class=""space-between"" style=""width: 174mm; margin-top: {GetPrintTopMargin()}mm; margin-left: {GetPrintLeftMargin()}mm; display: inline-flex;"">
                        <span class=""opacity-zero"">[별지 제10호 서식]</span>
                        <span>{GetHospitalAddress(prescription)}</span>
                        <span>{purposeStr}</span>
                    </div>
                    {Get처방전Table(prescription, pageNum, purpose)}
                    {GetQrCode(prescription, purpose)}
                </div>
            ";

            return body;
        }

        private static string GetQrCode(PrescriptionInfo prescription, string purpose)
        {
            var barcodeType = (BarCodeType)Meta.GetOption(Constants.FOptionKeys.BarCodeType).Value.ToInt();
            if (barcodeType != BarCodeType.UBBarCode) return string.Empty;

            if (!CallDll.MakePrescriptionQrCode(prescription, purpose)) return string.Empty;

            var qrImgPath = Path.Combine(YsrPathUtil.GetYsrTempPath(), "UBBARCodeImg.bmp");
            var qrCode = $@"
                <div style=""position: absolute; top: {GetQrCodeTop()}mm; left: {GetQrCodeLeft()}mm;"">
                    <img src=""{qrImgPath}"" style=""width: {GetQrCodeSize()}mm; height: {GetQrCodeSize()}mm;"" alt="""" onerror=""this.style.display='none'"" />
                </div>
            ";

            return qrCode;
        }

        private static int GetPrintLeftMargin()
        {
            var printLeftMargin = Meta.GetOption(Constants.FOptionKeys.PrintConfig.원외처방전.왼쪽여백).Value.StringNumberToInt();

            const int defaultLeftMargin = 18;
            if (printLeftMargin <= 0) printLeftMargin = defaultLeftMargin;

            return printLeftMargin;
        }

        private static int GetPrintTopMargin()
        {
            var printTopMargin = Meta.GetOption(Constants.FOptionKeys.PrintConfig.원외처방전.위여백).Value.StringNumberToInt();

            const int defaultTopMargin = 23;
            if (printTopMargin <= 0) printTopMargin = defaultTopMargin;

            return printTopMargin;
        }

        private static int GetQrCodeSize()
        {
            var qrCodeSizes = new List<int> { 30, 28, 26, 24, 22, 20 };

            try
            {
                var index = Meta.GetOption(Constants.FOptionKeys.PrintConfig.원외처방전.바코드크기).Value.StringNumberToInt();
                return qrCodeSizes[index];
            }
            catch (Exception)
            {
                return qrCodeSizes[0];
            }
        }

        private static int GetQrCodeTop()
        {
            var qrCodeTop = Meta.GetOption(Constants.FOptionKeys.PrintConfig.원외처방전.바코드위치위).Value.StringNumberToInt();
            var qrCodeSize = GetQrCodeSize();

            const int defaultTop = 195;
            if (qrCodeTop <= 0) qrCodeTop = defaultTop;
            if (qrCodeTop > Constants.Numbers.Sizes.A4Height - qrCodeSize) qrCodeTop = Constants.Numbers.Sizes.A4Height - qrCodeSize;

            return qrCodeTop;
        }

        private static int GetQrCodeLeft()
        {
            var qrCodeLeft = Meta.GetOption(Constants.FOptionKeys.PrintConfig.원외처방전.바코드위치옆).Value.StringNumberToInt();
            var qrCodeSize = GetQrCodeSize();

            const int defaultLeft = 150;
            if (qrCodeLeft <= 0) qrCodeLeft = defaultLeft;
            if (qrCodeLeft > Constants.Numbers.Sizes.A4Width - qrCodeSize) qrCodeLeft = Constants.Numbers.Sizes.A4Width - qrCodeSize;

            return qrCodeLeft;
        }

        private static string Get조제시참고사항(PrescriptionInfo prescription)
            => prescription.Get조제시참고사항().ReplaceLineFeed("<br>");

        private static string Get환자주민번호(PrescriptionInfo prescription, string purpose)
        {
            var isPrintRegiNumberMasking = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintRegiNumberMasking).Value.ToBool();
            var residentRegistrationNumber = prescription.PatientId;

            return purpose == "환자보관용" && isPrintRegiNumberMasking ? residentRegistrationNumber.GetMaskedResidentRegistrationNumber() : residentRegistrationNumber;
        }

        private static string Get환자연락처(PrescriptionInfo prescription, string purpose)
            => purpose == "환자보관용" ? string.Empty : prescription.환자연락처;

        private static string Get처방전Table(PrescriptionInfo prescription, int pageNum, string purpose)
        {
            var 원외약 = Get원외약Prescriptions(prescription, pageNum);
            var 주사제 = Get주사제Prescriptions(prescription, pageNum);

            var table = $@"
                <table class=""table2"" style=""width: 175mm; margin-top: 1mm; margin-left: {GetPrintLeftMargin()}mm;"">
                    <tr style=""height: 22.5mm;"">
                        <td colspan=""6"" style=""padding-top: 5mm;"">
                            <div style=""position: relative;"">
                                <span>명칭: {GetInsuranceInfoByName(prescription, "조합명칭")}</span>
                                <span style=""width: 70mm; font-size: 24px; font-weight: bolder; margin-left: 42mm;"">
                                    <span class=""opacity-zero"" style=""margin-right: 26mm;"">처</span>
                                    <span class=""opacity-zero"" style=""margin-right: 26mm;"">방</span>
                                    <span class=""opacity-zero"">전</span>
                                </span>
                                <br />
                                <span style=""display: inline-block; width: 140px;"">코드: {GetInsuranceInfoByName(prescription, "조합기호")}</span>
                                <span style=""display: inline-block; width: 140px;"">증: {GetInsuranceInfoByName(prescription, "증번호")}</span>
                                <span style=""display: inline-block; width: 140px;"">피보험자: {GetInsuranceInfoByName(prescription, "피보험자명")}</span>
                                {Get환자연락처(prescription, purpose)}
                                <br />
                                <span class=""opacity-zero"" style=""font-size: 12px;"">
                                    [{GetInsuranceCheck(prescription, 처방전보험구분.의료보험)}] 의료보험 &nbsp; 
                                    [{GetInsuranceCheck(prescription, 처방전보험구분.의료보호)}] 의료보호 &nbsp; 
                                    [{GetInsuranceCheck(prescription, 처방전보험구분.산재보험)}] 산재보험 &nbsp; 
                                    [{GetInsuranceCheck(prescription, 처방전보험구분.자동차보험)}] 자동차보험 &nbsp; 
                                    [{GetInsuranceCheck(prescription, 처방전보험구분.기타)}] 기타 ( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )
                                </span>
                                <span style=""margin-left: 2mm;""><span class=""opacity-zero"">요양기관기호: </span>{GetHospitalByName(prescription, "HospitalId")}</span>
                                {GetInsuranceCheck원외처방전양식지(prescription, 처방전보험구분.의료보험)}
                                {GetInsuranceCheck원외처방전양식지(prescription, 처방전보험구분.의료보호)}
                                {GetInsuranceCheck원외처방전양식지(prescription, 처방전보험구분.산재보험)}
                                {GetInsuranceCheck원외처방전양식지(prescription, 처방전보험구분.자동차보험)}
                                {GetInsuranceCheck원외처방전양식지(prescription, 처방전보험구분.기타)}
                            </div>
                        </td>
                    </tr>
                    <tr style=""height: 6.5mm;"">
                        <td class=""text-center opacity-zero"" style=""width: 14mm; font-size: 12px;"">교부번호</td>
                        <td class=""border-remove-right"" style=""width: 72mm; font-size: 12px;"">
                            <span style=""margin-left: 4.5mm;"">{GetPrescriptionIssueYear(prescription)}</span><span class=""opacity-zero"">년</span>
                            <span style=""margin-left: 1.5mm;"">{GetPrescriptionIssueMonth(prescription)}</span><span class=""opacity-zero"">월</span>
                            <span style=""margin-left: 3mm;"">{GetPrescriptionIssueDay(prescription)}</span>
                            <span class=""opacity-zero"" style=""margin-left: 2mm;"">일 &nbsp; - &nbsp;제 </span>
                            <span style=""margin-left: 5mm;"">{GetPrescriptionIssueNumber(prescription)}</span><span class=""opacity-zero""> 호</span>
                        </td>
                        <td rowspan=""4"" class=""text-center opacity-zero"" style=""width: 8mm; font-size: 12px;"">의<br />료<br />기<br />관</td>
                        <td class=""text-center  opacity-zero"" style=""width: 14mm; font-size: 12px;"">명 &nbsp; &nbsp; &nbsp; 칭</td>
                        <td style=""width: 65mm; font-size: 12px;""><span style=""margin-left: 2px;"">{GetHospitalByName(prescription, "HospitalName")}</span></td>
                    </tr>
                    <tr style=""height: 6.5mm;"">
                        <td colspan=""2"" rowspan=""3"" style=""margin: 0; padding: 0;"">
                            <table class=""in-table2"">
                                <tr style=""height: 9.5mm;"">
                                    <td rowspan=""2"" class=""text-center border-remove-top-left border-remove-bottom opacity-zero"" style=""width: 9.5mm; font-size: 12px;"">환<br />자</td>
                                    <td class=""text-center border-remove-top opacity-zero"" style=""width: 27mm; font-size: 12px;"">성 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 명</td>
                                    <td class=""border-remove-top-right"" style=""width: 50mm; font-size: 12px;"">{prescription.PatientName}</td>
                                </tr>
                                <tr style=""height: 10mm;"">
                                    <td style=""width: 27mm; font-size: 12px;"" class=""text-center border-remove-bottom opacity-zero"">주민등록번호</td>
                                    <td style=""width: 50mm; font-size: 12px;"" class=""border-remove-bottom-right"">{Get환자주민번호(prescription, purpose)}</td>
                                </tr>
                            </table>
                        </td>
                        <td class=""text-center opacity-zero"" style=""font-size: 12px;"">전화번호</td>
                        <td style=""font-size: 12px;""><span style=""margin-left: 2px;"">{GetHospitalByName(prescription, "HospitalTelNum")}</span></td>
                    </tr>
                    <tr style=""height: 6.5mm;"">
                        <td class=""text-center opacity-zero"" style=""font-size: 12px;"">팩스번호</td>
                        <td style=""font-size: 12px;""><span style=""margin-left: 2px;"">{GetHospitalByName(prescription, "HospitalFaxNum")}</span></td>
                    </tr>
                    <tr style=""height: 6.5mm;"">
                        <td class=""text-center opacity-zero"" style=""font-size: 10px;"">e-mail 주소</td>
                        <td style=""font-size: 12px;""><span style=""margin-left: 2px;"">{prescription.HospitalEMail}</span></td>
                    </tr>
                    <tr>
                        <td colspan=""6"" style=""margin: 0; padding: 0;"">
                            {Get질병분류기호Table(prescription)}
                        </td>
                    </tr>
                    <tr style=""height: 6.5mm;"">
                        <td colspan=""6"" class=""opacity-zero"">
                            <span>&nbsp;&nbsp; ※ 환자의 요구가 있는 때에는 질병분류기호를 기재하지 아니합니다.</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan=""6"" style=""margin: 0; padding: 0;"">
                            {Get처방Table(원외약, 주사제, prescription)}
                        </td>
                    </tr>
                </table>
            ";

            return table;
        }

        private static string Get질병분류기호Table(PrescriptionInfo prescription)
        {
            var table = $@"
                <table class=""in-table2"">
                    <tr style=""height: 5mm;"">
                        <td rowspan=""2"" class=""text-center border-remove-top-left border-remove-bottom opacity-zero"" style=""width: 9.5mm; font-size: 10px;"">질병<br />분류<br />기호</td>
                        <td class=""border-remove-top-left dis-code-cell"">{Get질병분류기호(prescription, 0, true)}</td>
                        <td class=""border-remove-top dis-code-cell"">{Get질병분류기호(prescription, 1, true)}</td>
                        <td class=""border-remove-top dis-code-cell"">{Get질병분류기호(prescription, 2, true)}</td>
                        <td class=""border-remove-top dis-code-cell"">{Get질병분류기호(prescription, 3, true)}</td>
                        <td class=""border-remove-top-right dis-code-cell"">{Get질병분류기호(prescription, 4, true)}</td>
                        <td class=""border-remove-top-bottom opacity-zero"" rowspan=""2"" style=""width: 11mm; font-size: 10px;"">처 방<br />의료인의<br />성 명</td>
                        <td class=""border-remove-top-bottom"" rowspan=""2"" style=""width: 46mm; font-size: 12px;"">
                            <div style=""position: relative;"">
                                <span style=""margin-left: 5px;"">{GetDoctorName(prescription)}</span>
                                {GetDoctorSign(prescription)}
                            </div>
                        </td>
                        <td class=""border-remove-top text-center opacity-zero"" style=""width: 12mm; font-size: 10px;"">면허종별</td>
                        <td class=""border-remove-top-right"" style=""width: 43mm; font-size: 12px;""><span style=""margin-left: 2px;"">{GetLicenseType()}</span></td>
                    </tr>
                    <tr style=""height: 5mm;"">
                        <td class=""border-remove-bottom-left dis-code-cell"">{Get질병분류기호(prescription, 0, false)}</td>
                        <td class=""border-remove-bottom dis-code-cell"">{Get질병분류기호(prescription, 1, false)}</td>
                        <td class=""border-remove-bottom dis-code-cell"">{Get질병분류기호(prescription, 2, false)}</td>
                        <td class=""border-remove-bottom dis-code-cell"">{Get질병분류기호(prescription, 3, false)}</td>
                        <td class=""border-remove-bottom-right dis-code-cell"">{Get질병분류기호(prescription, 4, false)}</td>
                        <td class=""border-remove-bottom text-center opacity-zero"" style=""font-size: 10px;"">면허번호</td>
                        <td style=""border-bottom: none; border-right: none; font-size: 12px;"">
                            <span style=""margin-left: 4mm;"" class=""opacity-zero"">제</span>
                            <span style=""margin-left: 6mm;"">{GetLicenseNumber(prescription)}</span>
                            <span style=""margin-left: 6mm;"" class=""opacity-zero"">호</span>
                        </td>
                    </tr>
                </table>
            ";

            return table;
        }

        private static string Get처방Table(IReadOnlyList<PrescriptionItem> 원외약, IReadOnlyList<PrescriptionItem> 주사제, PrescriptionInfo prescription)
        {
            var htmlBuilder = new StringBuilder();

            htmlBuilder.Append($@"
                    <table class=""in-table2"">
                        <tr style=""height: 9.5mm"">
                            <td colspan=""2"" class=""text-center border-remove-top-left opacity-zero"" style=""width: 81.5mm"">처방 의약품의 명칭</td>
                            <td class=""text-center border-remove-top opacity-zero"" style=""width: 12mm; font-size: 10px;"">1 회<br />투여량</td>
                            <td class=""text-center border-remove-top opacity-zero"" style=""width: 12mm; font-size: 10px; "">1 일<br />투여횟수</td>
                            <td class=""text-center border-remove-top opacity-zero"" style=""width: 12mm; font-size: 10px; "">총<br />투약일수</td>
                            <td class=""text-center border-remove-top-right opacity-zero"" style=""width: 55mm;"">용 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 법</td>
                        </tr>
                        <tr class=""drug-row"">
                            <td colspan=""2"" class=""border-remove-left {원외약[0].NameAlign}"">{원외약[0].HtmlName}</td>
                            <td class=""text-center"">{원외약[0].TrDosePerCnt}</td>
                            <td class=""text-center"">{원외약[0].TrCnt}</td>
                            <td class=""text-center border-remove-right"">{원외약[0].TrDay}</td>
                            <td class=""border-remove-bottom-right {원외약[0].NameAlign}"">
                                <span class=""usage"">{원외약[0].TreatMethod}</span>{Get매식전간후시분복용(string.IsNullOrEmpty(원외약[0].TreatMethod))}
                            </td>
                        </tr>
            ");

            for (var i = 1; i < MaxLength원외약 - 1; i++)
            {
                htmlBuilder.Append($@"
                        <tr class=""drug-row"">
                            <td colspan=""2"" class=""border-remove-left {원외약[i].NameAlign}"">{원외약[i].HtmlName}</td>
                            <td class=""text-center"">{원외약[i].TrDosePerCnt}</td>
                            <td class=""text-center"">{원외약[i].TrCnt}</td>
                            <td class=""text-center"">{원외약[i].TrDay}</td>
                            <td class=""border-remove-top-bottom border-remove-right {원외약[i].NameAlign}"">
                                <span class=""usage"">{원외약[i].TreatMethod}</span>
                            </td>
                        </tr>
                ");
            }

            #region 처방전 마지막 약품 용법 존재하는경우 용법 출력, 그렇지 않은 경우 "조제시참고사항" 타이틀 출력

            var lastMethodHtml = 원외약[MaxLength원외약 - 1].TreatMethod.IsNullOrEmpty()
                ? @"
                            <td class=""text-center border-remove-right opacity-zero"">조 제 시 참 고 사 항</td>
"
                : $@"
                            <td class=""border-remove-top-bottom border-remove-right {원외약[MaxLength원외약 - 1].NameAlign}"">
                                <span class=""usage"">{원외약[MaxLength원외약 - 1].TreatMethod}</span>
                            </td>
";

            #endregion

            htmlBuilder.Append($@"
                        <tr class=""drug-row"">
                            <td colspan=""2"" class=""border-remove-left {원외약[MaxLength원외약 - 1].NameAlign}"">{원외약[MaxLength원외약 - 1].HtmlName}</td>
                            <td class=""text-center"">{원외약[MaxLength원외약 - 1].TrDosePerCnt}</td>
                            <td class=""text-center"">{원외약[MaxLength원외약 - 1].TrCnt}</td>
                            <td class=""text-center"">{원외약[MaxLength원외약 - 1].TrDay}</td>
                            {lastMethodHtml}
                        </tr>
                        <tr class=""drug-row"">
                            <td colspan=""5"" class=""text-center border-remove-left border-remove-bottom-right"" style=""font-size: 13px;"">
                                <div style=""position: relative;"">
                                    <span class=""opacity-zero"">
                                        주사제 처방내역 (원내조제 <input type=""checkbox"" {PrintHelper.GetChecked(Has주사제By원내외구분(prescription, 원내외구분.원내))} />, 
                                        원외처방 <input type=""checkbox"" {PrintHelper.GetChecked(Has주사제By원내외구분(prescription, 원내외구분.원외))} />)
                                    </span>
                                    {Get주사제Check원외처방전양식지(prescription, 원내외구분.원내)}
                                    {Get주사제Check원외처방전양식지(prescription, 원내외구분.원외)}
                                </div>
                            </td>
                            <td rowspan=""8"" class=""border-remove-right"" style=""vertical-align: top;"">
                                <span class=""pharmacy-note"">
                                    {Get조제시참고사항(prescription)}
                                </span>
                            </td>
                        </tr>
            ");

            for (var i = 0; i < MaxLength주사제; i++)
            {
                htmlBuilder.Append($@"
                        <tr class=""drug-row"">
                            <td colspan=""2"" class=""border-remove-left {주사제[i].NameAlign}"">{주사제[i].HtmlName}</td>
                            <td class=""text-center"">{주사제[i].TrDosePerCnt}</td>
                            <td class=""text-center"">{주사제[i].TrCnt}</td>
                            <td class=""text-center"">{주사제[i].TrDay}</td>
                        </tr>
                ");
            }

            htmlBuilder.Append($@"
                        <tr class=""drug-row"" style=""height: 6.5mm;"">
                            <td class=""text-center border-remove-bottom-left opacity-zero"" style=""width: 16.5mm"">사용기간</td>
                            <td class=""text-center border-remove-bottom"" style=""width: 64mm;"">
                                <span class=""opacity-zero"">교부일로부터 ( &nbsp; &nbsp; </span>{prescription.ValidPeriod}<span class=""opacity-zero""> &nbsp; &nbsp; ) 일간</span>
                            </td>
                            <td colspan=""4"" class=""text-center border-remove-bottom-right"">
                                <span class=""opacity-zero"" style=""font-size: 14px; font-weight: bold;"">&nbsp;&nbsp; ※ 사용 기간내에 약국에 제출하여야 합니다.</span>
                            </td>
                        </tr>
                        <tr style=""height: 6.4mm;"">
                            <td colspan=""6"" class=""text-center border-remove-left border-remove-right"">
                                <span class=""space-between opacity-zero"" style=""font-size: 12px; font-weight: bolder; margin: 0 auto; width: 250px;"">
                                    <span>의</span><span>약</span><span>품</span><span>조</span><span>제</span><span>내</span><span>역</span>
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan=""6"" style=""margin: 0; padding: 0;"" class=""border-remove-bottom-left border-remove-right opacity-zero"">
                                {Get조제내역Table()}
                            </td>
                        </tr>
                    </table>
            ");

            return htmlBuilder.ToString();
        }

        private static string Get조제내역Table()
        {
            const string table = @"
		        <table class=""in-table2"">
			        <tr style=""height: 6.2mm;"">
				        <td rowspan=""4"" class=""text-center border-remove-top-left border-remove-bottom"" style=""width: 9.5mm;"">
					        조<br />제<br />내<br />역
				        </td>
				        <td class=""text-center border-remove-top"" style=""width: 24mm; font-size: 12px;"">조제기관의 명칭</td>
				        <td colspan=""2"" class=""border-remove-top""></td>
				        <td class=""text-center border-remove-top-right"" style=""width: 76mm;"">처방의 변경, 수정, 확인 대체 시 그 내용 등</td>
			        </tr>
			        <tr style=""height: 6.2mm;"">
				        <td class=""text-center"" style=""font-size: 12px;"">조 제 약 사</td>
				        <td class=""text-center"" style=""width: 6.8mm; font-size: 12px;"">성명</td>
				        <td class=""border-remove-right"" style=""width: 56mm;"">
					        <span style=""float: right;"">(서명 또는 날인)</span>
				        </td>
				        <td rowspan=""3"" class=""border-remove-bottom-right""></td>
			        </tr>
			        <tr style=""height: 6.2mm;"">
				        <td class=""text-center"" style=""font-size: 11px;"">조제량(조제일수)</td>
				        <td colspan=""2""></td>
			        </tr>
			        <tr style=""height: 6.2mm;"">
				        <td class=""text-center border-remove-bottom"" style=""font-size: 12px;"">조 제 년 월 일</td>
				        <td colspan=""2"" class=""border-remove-bottom""></td>
			        </tr>
		        </table>
            ";

            return table;
        }

        private static string GetDoctorName(PrescriptionInfo prescription)
        {
            var isPrintDoctorName = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintDoctorName).Value.ToBool();
            return !isPrintDoctorName ? string.Empty : prescription.DoctorName ?? string.Empty;
        }

        private static string GetDoctorSign(PrescriptionInfo prescription)
        {
            const string 서명또는날인 = @"<span class=""opacity-zero"" style=""font-size: 9px; position: absolute; top: 3.5mm; left: 25mm;"">(서명 또는 날인)</span>";

            try
            {
                var isPrintDoctorSign = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintDoctorSign).Value.ToBool();
                var doctor = Meta.Users.FirstOrDefault(x => x.UserId == prescription.DoctorId);
                if (doctor == null) return 서명또는날인;

                var signImage = Convert.ToBase64String(doctor.SignImage);
                if (isPrintDoctorSign && !string.IsNullOrWhiteSpace(signImage))
                {
                    return $@"
                        <span style=""position: absolute; top: -2.5mm; left: 17mm;"">
                            <img src=""data:image/jpg;base64, {signImage}"" alt=""sign"" class=""sign"" />
                        </span>
                    ";
                }

                return 서명또는날인;
            }
            catch (Exception)
            {
                return 서명또는날인;
            }
        }

        private static string GetLicenseType()
        {
            var isPrintLicenseType = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintLicenseType).Value.ToBool();
            return !isPrintLicenseType ? string.Empty : "의사";
        }

        private static string GetLicenseNumber(PrescriptionInfo prescription)
        {
            var isPrintLicenseNumber = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintLicenseNumber).Value.ToBool();
            return !isPrintLicenseNumber ? string.Empty : prescription.DoctorLicenseNum;
        }

        private static string GetHospitalAddress(PrescriptionInfo prescription)
        {
            var isPrintHospitalAddress = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintHospitalAddress).Value.ToBool();
            if (!isPrintHospitalAddress) return string.Empty;

            var address = prescription.HospitalAddress ?? string.Empty;
            return string.IsNullOrEmpty(address) ? string.Empty : "소재지: " + address;
        }

        private static string GetInsuranceInfoByName(PrescriptionInfo prescription, string name)
        {
            var isPrintInsuranceInfo = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintInsuranceInfo).Value.ToBool();
            if (!isPrintInsuranceInfo) return string.Empty;

            if (prescription.IsNull()) return string.Empty;

            return prescription?.GetType().GetProperty(name)?.GetValue(prescription)?.ToString() ?? string.Empty;
        }

        private static string GetHospitalByName(PrescriptionInfo prescription, string name)
        {
            var isPrintHospitalInfo = Meta.GetOption(Constants.FOptionKeys.PrintConfig.IsPrintHospitalInfo).Value.ToBool();
            if (!isPrintHospitalInfo) return string.Empty;

            if (prescription.IsNull()) return string.Empty;

            return prescription?.GetType().GetProperty(name)?.GetValue(prescription)?.ToString() ?? string.Empty;
        }

        private static string GetInsuranceCheck(PrescriptionInfo prescription, 처방전보험구분 처방전보험구분)
        {
            switch (처방전보험구분)
            {
                case 처방전보험구분.의료보험 when prescription.Is의료보험:
                case 처방전보험구분.의료보호 when prescription.Is의료급여:
                case 처방전보험구분.산재보험 when prescription.Is산재보험:
                case 처방전보험구분.자동차보험 when prescription.Is자동차보험:
                case 처방전보험구분.기타 when prescription.Is기타보험:
                    return "V";
                default:
                    return ((int)처방전보험구분).ToString();
            }
        }

        private static string GetInsuranceCheck원외처방전양식지(PrescriptionInfo prescription, 처방전보험구분 처방전보험구분)
        {
            if (MetaOptionHelper.Get출력방법() != 출력방법.원외처방전양식지) return string.Empty;
            if (prescription.IsPreview) return string.Empty;

            switch (처방전보험구분)
            {
                case 처방전보험구분.의료보험 when prescription.Is의료보험:
                    return @"<div class=""check-marker-div"" style=""top: 11mm; left: 0.7mm;"">V</div>";
                case 처방전보험구분.의료보호 when prescription.Is의료급여:
                    return @"<div class=""check-marker-div"" style=""top: 11mm; left: 20.7mm;"">V</div>";
                case 처방전보험구분.산재보험 when prescription.Is산재보험:
                    return @"<div class=""check-marker-div"" style=""top: 11mm; left: 40.7mm;"">V</div>";
                case 처방전보험구분.자동차보험 when prescription.Is자동차보험:
                    return @"<div class=""check-marker-div"" style=""top: 11mm; left: 60.8mm;"">V</div>";
                case 처방전보험구분.기타 when prescription.Is기타보험:
                    return @"<div class=""check-marker-div"" style=""top: 11mm; left: 84.2mm;"">V</div>";
                default:
                    return string.Empty;
            }
        }

        private static string Get주사제Check원외처방전양식지(PrescriptionInfo prescription, 원내외구분 원내외구분)
        {
            if (MetaOptionHelper.Get출력방법() != 출력방법.원외처방전양식지) return string.Empty;
            if (prescription.IsPreview) return string.Empty;

            switch (원내외구분)
            {
                case 원내외구분.원내 when Has주사제By원내외구분(prescription, 원내외구분.원내):
                    return @"<div class=""check-marker-div"" style=""top: 0.3mm; left: 70mm;"">V</div>";
                case 원내외구분.원외 when Has주사제By원내외구분(prescription, 원내외구분.원외):
                    return @"<div class=""check-marker-div"" style=""top: 0.3mm; left: 93.5mm; "">V</div>";
                default:
                    return string.Empty;
            }
        }

        private static string Get질병분류기호(PrescriptionInfo prescription, int seq, bool is주상병)
        {
            var disease = is주상병 ? prescription.DiseaseMain : prescription.DiseaseSub;
            return disease.IsNullOrEmpty() ? string.Empty : disease.SafeSubstring(seq, 1);
        }

        private static string Get매식전간후시분복용(bool isShow)
        {
            return isShow ? @"<span class=""opacity-zero"" style=""float: right; font-size: 10px; margin-right: 5px;"">매식(전,간,후) 시 분복용</span>" : string.Empty;
        }

        private static string GetPrescriptionIssueYear(PrescriptionInfo prescription)
        {
            const string empty = "&nbsp; &nbsp; &nbsp; &nbsp; ";
            if (prescription.IssueYear == "9999") return empty;
            return string.IsNullOrEmpty(prescription.IssueYear) ? empty : prescription.IssueYear;
        }

        private static string GetPrescriptionIssueMonth(PrescriptionInfo prescription)
        {
            const string empty = "&nbsp; &nbsp; ";
            if (prescription.IssueYear == "9999") return empty;
            return string.IsNullOrEmpty(prescription.IssueMonth) ? empty : prescription.IssueMonth;
        }

        private static string GetPrescriptionIssueDay(PrescriptionInfo prescription)
        {
            const string empty = "&nbsp; &nbsp; ";
            if (prescription.IssueYear == "9999") return empty;
            return string.IsNullOrEmpty(prescription.IssueDay) ? empty : prescription.IssueDay;
        }

        private static string GetPrescriptionIssueNumber(PrescriptionInfo prescription)
        {
            const string empty = "&nbsp; &nbsp; &nbsp; &nbsp; ";
            if (prescription.IssueYear == "9999") return empty;
            return string.IsNullOrEmpty(prescription.IssueNumber) ? empty : prescription.IssueNumber;
        }
    }
}
