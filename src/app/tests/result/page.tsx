import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import ResultByDate from "./result-by-date";

const TestsResultPage = () => {
  return (
    <div className="flex flex-col w-full h-full">
      <span className="p-4 text-2xl font-bold">검사결과</span>
      <Tabs
        className="flex w-full h-full mt-4 overflow-hidden"
        defaultValue="by-date"
      >
        <TabsList className="bg-white rounded-none">
          <TabsTrigger
            value="by-date"
            className="hover:bg-gray-100 data-[state=active]:border-b-primary cursor-pointer data-[state=active]:shadow-none p-4 rounded-none"
          >
            날짜별
          </TabsTrigger>
          <TabsTrigger
            value="by-patient"
            className="hover:bg-gray-100 cursor-pointer data-[state=active]:border-b-primary rounded-none data-[state=active]:shadow-none p-4"
          >
            환자별
          </TabsTrigger>
        </TabsList>
        <div className="flex w-full h-full p-4 overflow-hidden bg-gray-200">
          <div className="flex w-full h-full bg-white rounded-lg">
            <ResultByDate />
            <TabsContent value="by-patient">
              <div>test2</div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default TestsResultPage;
