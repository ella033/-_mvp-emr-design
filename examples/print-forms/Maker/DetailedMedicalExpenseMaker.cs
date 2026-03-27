using System.Drawing;
using Newtonsoft.Json;
using System.Text;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.ExternalLinkage;
using Ysr.Framework.Business.Common.Model;
using Ysr.Framework.Common.Global.Helper;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class DetailedMedicalExpenseMaker
    {
        public static string GetDetailedMedicalExpense(DetailedMedicalExpenseRequestData data)
        {
            //Todo 속도개선, 출력해야할 전체 진료비내역서를 JSON으로 넘긴다음 한꺼번에 처리
            var result = CallDll.CreateDetailedMedicalExpenseImage(data);
            if (!result) return string.Empty;

            var htmlBuilder = new StringBuilder();
            if (data.PrintWithOtherDocument)
            {
                htmlBuilder.Append(PrintHelper.GetPrefixHtml(string.Empty));
                var detailedMedicalExpenseReturn = JsonConvert.DeserializeObject<DetailedMedicalExpenseReturn>(data.ImagePaths);
                using (var image = Image.FromFile(detailedMedicalExpenseReturn.imagePaths[0].path))
                {
                    image.RotateFlip(RotateFlipType.Rotate90FlipNone);
                    image.Save(detailedMedicalExpenseReturn.imagePaths[0].path, System.Drawing.Imaging.ImageFormat.Png);
                }
                htmlBuilder.Append(GetDetailedMedicalExpenseWithOtherDocument(detailedMedicalExpenseReturn));
                htmlBuilder.Append(PrintHelper.GetSuffixHtml());
            }
            else
            {
                htmlBuilder.Append(PrintHelper.GetPrefixHtmlLandscape(string.Empty));
                var detailedMedicalExpenseReturn = JsonConvert.DeserializeObject<DetailedMedicalExpenseReturn>(data.ImagePaths);
                htmlBuilder.Append(GetDetailedMedicalExpense(detailedMedicalExpenseReturn));
                htmlBuilder.Append(PrintHelper.GetSuffixHtml());
            }
            return htmlBuilder.ToString();
        }

        private static string GetDetailedMedicalExpenseWithOtherDocument(DetailedMedicalExpenseReturn detailedMedicalExpenseReturn)
        {
            var body = new StringBuilder();
            detailedMedicalExpenseReturn.imagePaths.ForEach(
                x =>
                {
                    body.AppendLine($@"
                <div class=""A4"">
                    <div>	
                        <img src=""{x.path}"" style="" height: 100%; width: 100%;"" onerror=""this.style.display = 'none'"" />
                    </div>
                </div>");
                });

            return body.ToString();
        }

        private static string GetDetailedMedicalExpense(DetailedMedicalExpenseReturn detailedMedicalExpenseReturn)
        {
            var body = new StringBuilder();
            detailedMedicalExpenseReturn.imagePaths.ForEach(
                x =>
                {
                    body.AppendLine($@"
                <div class=""A4"">
                    <div style=""position:absolute; "">	
                        <img src=""{x.path}"" style="" height: 100%; width: 100%;"" onerror=""this.style.display = 'none'"" />
                    </div>
                </div>");
                });

            return body.ToString();
        }
    }
}
