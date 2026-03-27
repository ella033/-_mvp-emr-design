import MyPopup from "@/components/yjg/my-pop-up";
import TemplateCodePage from "@/app/master-data/_components/(tabs)/(template-code)/template-code-page";

export default function TemplateCodePopup({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) {
  return (
    <MyPopup
      isOpen={true}
      onCloseAction={() => setOpen(false)}
      title="상용구 설정"
      width="90vw"
      height="90vh"
      minWidth="900px"
      minHeight="600px"
      localStorageKey="template-code-popup"
    >
      <TemplateCodePage />
    </MyPopup>
  );
}
