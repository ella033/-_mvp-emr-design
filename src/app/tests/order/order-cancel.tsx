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
import { dummyOrderRequested } from "@/data/dummy-order-requested";
import { TabsContent } from "@radix-ui/react-tabs";
import { useState } from "react";

const OrderCancel = () => {
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const filteredRequested = dummyOrderRequested.sort((a, b) =>
    a.의뢰일시.localeCompare(b.의뢰일시)
  );
  const allChecked =
    filteredRequested.length > 0 &&
    filteredRequested.every((item) => checkedRows.includes(item.환자번호));
  const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setCheckedRows(filteredRequested.map((item) => item.환자번호));
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
    <TabsContent
      value="cancel"
      className="flex flex-col w-full h-full gap-4 p-4 pb-0"
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-bold">취소요청</span>
        <Button className="font-bold bg-red-400 cursor-pointer hover:bg-red-500">
          취소 요청하기
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
              "수탁기관명",
              "환자번호",
              "환자명",
              "검사코드",
              "검사아이템명",
              "검체",
              "의뢰일시",
              "취소일시",
            ].map((item) => (
              <TableHead className="flex items-center flex-1" key={item}>
                {item}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequested.map((item) => (
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
                  <TableCell
                    className={`flex-1 ${key === "취소일시" && value !== null ? "text-red-500" : ""}`}
                    key={key}
                  >
                    {value}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TabsContent>
  );
};

export default OrderCancel;
