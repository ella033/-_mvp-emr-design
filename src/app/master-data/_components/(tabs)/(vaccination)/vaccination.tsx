import { MasterDataContainer } from "../../(common)/common-controls";
import MySplitPane from "@/components/yjg/my-split-pane";
import VaccinationMasterGrid from "./vaccination-master-grid";
import VaccinationUserCodeGrid from "./vaccination-user-code-grid";
import VaccinationDetail from "./vaccination-detail";

export default function Vaccination() {
  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="library-vaccination"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[<VaccinationList />, <VaccinationDetail />]}
      />
    </div>
  );
}

function VaccinationList() {
  return (
    <MasterDataContainer>
      <MySplitPane
        splitPaneId="library-vaccination-list"
        initialRatios={[0.5, 0.5]}
        panes={[<VaccinationMasterGrid />, <VaccinationUserCodeGrid />]}
      />
    </MasterDataContainer>
  );
}
