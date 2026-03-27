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
import { TabsContent } from "@radix-ui/react-tabs";
import { useState } from "react";
import { dummyFoundation } from "@/data/dummy-foundation";
import { dummyOrderRequestWaiting } from "@/data/dummy-order-request-waiting";

const OrderRequest = () => {
  const [selectedMedicalFoundation, setSelectedMedicalFoundation] =
    useState<string>("");
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const filteredRequests = dummyOrderRequestWaiting
    .filter((item) => item.의뢰기관 === selectedMedicalFoundation)
    .sort((a, b) => a.진료일.localeCompare(b.진료일));
  const allChecked =
    filteredRequests.length > 0 &&
    filteredRequests.every((item) => checkedRows.includes(item.환자번호));
  const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setCheckedRows(filteredRequests.map((item) => item.환자번호));
    } else {
      setCheckedRows([]);
    }
  };
  const handleCheckRow = (id: string, checked: boolean) => {
    setCheckedRows((prev) =>
      checked ? [...prev, id] : prev.filter((rowId) => rowId !== id)
    );
  };
  return (
    <TabsContent value="request" className="grid w-full grid-cols-5">
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
      <div className="flex-1 col-span-4 p-4 pb-0">
        {selectedMedicalFoundation ? (
          <div className="flex flex-col w-full gap-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-bold">{selectedMedicalFoundation}</span>
              <Button className="font-bold bg-blue-400 cursor-pointer hover:bg-blue-500">
                전체 의뢰하기
              </Button>
            </div>
            <Table className="relative">
              <TableHeader className="sticky top-0">
                <TableRow className="flex bg-amber-50">
                  <TableHead className="flex items-center w-[32px] max-w-[32px]">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => handleCheckAll(e)}
                    />
                  </TableHead>
                  {[
                    "환자번호",
                    "환자명",
                    "생년월일/성별",
                    "검사아이템명",
                    "검체",
                    "진료일",
                  ].map((item) => (
                    <TableHead className="flex items-center flex-1" key={item}>
                      {item}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((item) => (
                  <TableRow key={item.환자번호} className="flex">
                    <TableCell className="max-w-[32px] w-[32px]">
                      <input
                        type="checkbox"
                        checked={checkedRows.includes(item.환자번호)}
                        onChange={(e) =>
                          handleCheckRow(item.환자번호, e.target.checked)
                        }
                      />
                    </TableCell>
                    {Object.entries(item)
                      .filter(([key]) => key !== "의뢰기관")
                      .map(([key, value]) => (
                        <TableCell className={"flex-1"} key={key}>
                          {value}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            의뢰기관을 선택해주세요
          </div>
        )}
      </div>
    </TabsContent>
  );
};

export default OrderRequest;
