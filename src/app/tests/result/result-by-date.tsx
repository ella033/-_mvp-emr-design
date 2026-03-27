"use client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useState } from "react";
import { dummyFoundation } from "@/data/dummy-foundation";
// import { dummyOrderRequestWaiting } from "@/data/dummy-order-request-waiting";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { dummyOrderComplete } from "@/data/dummy-order-complete";

function getNowString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleClick = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      onRefresh();
    }, 3000);
  };

  return (
    <Button onClick={handleClick} disabled={refreshing}>
      {refreshing ? (
        <>
          <Loader2 className="animate-spin" />
          갱신 중
        </>
      ) : (
        "갱신"
      )}
    </Button>
  );
}

const ResultByDate = () => {
  const [selectedMedicalFoundation, setSelectedMedicalFoundation] =
    useState<string>("");
  // const filteredRequests = dummyOrderRequestWaiting
  //   .filter((item) => item.의뢰기관 === selectedMedicalFoundation)
  //   .sort((a, b) => a.진료일.localeCompare(b.진료일));
  const [selectedDate, setSelectedDate] = useState<string>("week");
  const items = [
    { value: "week", label: "최근 일주일" },
    { value: "month", label: "최근 한달" },
  ];
  const [lastUpdated, setLastUpdated] = useState<string>(getNowString());
  return (
    <TabsContent value="by-date" className="w-full h-full">
      <Tabs defaultValue="by-date" className="w-full h-full">
        <header className="flex items-center justify-between p-4 text-sm text-gray-500 border-b">
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">진료일시</span>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder="일시선택"
                  className={selectedDate ? "text-[#333]" : "text-[#999]"}
                />
              </SelectTrigger>
              <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-full">
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span>{lastUpdated}</span>
            <RefreshButton onRefresh={() => setLastUpdated(getNowString())} />
            <TabsList className="p-1 bg-gray-100 rounded-md">
              <TabsTrigger
                value="by-date"
                className="px-2 py-1 rounded-sm cursor-pointer hover:bg-gray-100 data-[state=active]:bg-white"
              >
                일자별
              </TabsTrigger>
              <TabsTrigger
                value="by-cumulative"
                className="hover:bg-gray-100 cursor-pointer data-[state=active]:bg-white rounded-sm px-2 py-1"
              >
                누적별
              </TabsTrigger>
            </TabsList>
          </div>
        </header>
        <TabsContent value="by-cumulative">test</TabsContent>
        <div className="grid w-full h-full grid-cols-5">
          <section className="flex flex-col col-span-1 gap-2 p-4 border-r">
            <div className="flex items-center justify-between w-full h-9.5 mb-4 font-bold">
              <span>검사의뢰하기</span>
              <span className="text-blue-400 ">의뢰이력</span>
            </div>
            {dummyFoundation.map((item) => (
              <div
                onClick={() => setSelectedMedicalFoundation(item.name)}
                key={item.name}
                className="p-2 rounded-md cursor-pointer hover:bg-gray-100"
              >
                {item.name}
              </div>
            ))}
          </section>
          <div className="flex-1 col-span-4 pb-0">
            {selectedMedicalFoundation ? (
              <div className="flex flex-col w-full gap-4">
                <div className="flex items-center justify-between w-full p-2 border-b">
                  <span className="font-bold">{selectedMedicalFoundation}</span>
                  <Button
                    variant={"outline"}
                    className="font-bold text-gray-500 cursor-pointer"
                  >
                    출력하기
                  </Button>
                </div>
                <Table className="relative">
                  <TableHeader className="sticky top-0">
                    <TableRow className="flex bg-amber-50">
                      {[
                        "검사아이템명",
                        "결과치",
                        "판정",
                        "참고치",
                        "결과보고일",
                      ].map((item) => (
                        <TableHead
                          className="flex items-center flex-1"
                          key={item}
                        >
                          {item}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyOrderComplete.map((item) => (
                      <TableRow key={item.환자번호} className="flex">
                        {Object.entries(item).map(([key, value]) => (
                          <TableCell className={"flex-1"} key={key}>
                            {typeof value === "object" && value !== null
                              ? Object.entries(value)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(", ")
                              : value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                검사결과를 선택해주세요
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </TabsContent>
  );
};

export default ResultByDate;
