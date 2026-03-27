import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderRequest from "./order-request";
import OrderCancel from "./order-cancel";

const TestsOrderPage = () => {
  return (
    <div className="flex flex-col w-full h-full">
      <span className="p-4 text-2xl font-bold">검사의뢰</span>
      <Tabs
        className="flex w-full h-full mt-4 overflow-hidden"
        defaultValue="request"
      >
        <TabsList className="bg-white rounded-none">
          <TabsTrigger
            value="request"
            className="hover:bg-gray-100 data-[state=active]:border-b-primary cursor-pointer data-[state=active]:shadow-none p-4 rounded-none"
          >
            검사의뢰
          </TabsTrigger>
          <TabsTrigger
            value="cancel"
            className="hover:bg-gray-100 cursor-pointer data-[state=active]:border-b-primary rounded-none data-[state=active]:shadow-none p-4"
          >
            검사취소
          </TabsTrigger>
        </TabsList>
        <div className="flex w-full h-full p-4 overflow-hidden bg-gray-200">
          <div className="flex w-full h-full bg-white rounded-lg">
            <OrderRequest />
            <OrderCancel />
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default TestsOrderPage;
