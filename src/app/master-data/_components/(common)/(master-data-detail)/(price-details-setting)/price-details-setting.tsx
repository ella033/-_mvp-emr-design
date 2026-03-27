import { Box, BoxContainer } from "../../common-controls";

import { useEffect, useState } from "react";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import {
  getDefaultPriceDetailsHeaders,
  LS_PRICE_DETAILS_HEADERS_KEY,
} from "./price-details-header";
import { getInitialHeaders } from "@/components/yjg/my-grid/my-grid-util";
import type { MyGridHeaderType, MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { saveHeaders } from "@/components/yjg/my-grid/my-grid-util";
import { convertPriceDetailsToGridRowType } from "./price-details-converter";
import { MyButton } from "@/components/yjg/my-button";
import { useToastHelpers } from "@/components/ui/toast";
import { formatDate } from "@/lib/date-utils";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { getPrice } from "@/app/master-data/(etc)/master-data-converter";

interface PriceDetailsSettingProps {
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
  isDrug?: boolean;
}

export default function PriceDetailsSetting({
  masterDataDetail,
  setMasterDataDetail,
  isDrug,
}: PriceDetailsSettingProps) {
  const { error } = useToastHelpers();
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(LS_PRICE_DETAILS_HEADERS_KEY, getDefaultPriceDetailsHeaders(masterDataDetail.type))
  );
  const [data, setData] = useState<MyGridRowType[]>([]);
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);

  useEffect(() => {
    if (masterDataDetail.priceDetails) {
      setData(convertPriceDetailsToGridRowType(masterDataDetail.priceDetails, isDrug));
    }
  }, [masterDataDetail.priceDetails]);

  const checkDuplicateDate = (date: string) => {
    const isDuplicate = masterDataDetail.priceDetails.some(
      (detail) => formatDate(detail.applyDate) === formatDate(date)
    );

    if (isDuplicate) {
      error("이미 존재하는 적용일입니다. 리스트에서 날짜를 수정해주세요.");
    }

    return isDuplicate;
  };

  const handleDelete = () => {
    setData((prevData) =>
      prevData.filter((row) => !selectedRows.includes(row))
    );
  };

  const handleAdd = () => {
    const today = formatDate(new Date(), "-");
    if (checkDuplicateDate(today)) return;

    const newDetail = {
      tempId: `temp-${masterDataDetail.priceDetails.length}`,
      applyDate: today,
      price: getPrice(masterDataDetail.prescriptionLibraryDetails, today).price,
      additionalPrice: getPrice(masterDataDetail.prescriptionLibraryDetails, today).additionalPrice,
      normalPrice: 0,
      actualPrice: 0,
    };

    const updatedDetails = [
      ...(masterDataDetail.priceDetails || []),
      newDetail,
    ];

    // 추가 후 내림차순 정렬
    updatedDetails.sort((a, b) => {
      const dateA = new Date(a.applyDate || "");
      const dateB = new Date(b.applyDate || "");
      return dateB.getTime() - dateA.getTime(); // 내림차순
    });

    setMasterDataDetail({
      ...masterDataDetail,
      priceDetails: updatedDetails,
    });
  };

  const handleDataChange = (
    rowKey: string | number,
    columnKey: string,
    value: string | number | boolean
  ) => {
    const detailIndex = masterDataDetail.priceDetails.findIndex(
      (detail) => detail.tempId === rowKey
    );

    if (detailIndex === -1) return;

    // applyDate 변경 시 중복 체크
    if (columnKey === "applyDate") {
      const newDate = String(value);
      if (checkDuplicateDate(newDate)) return;
    }

    const updatedDetails = masterDataDetail.priceDetails.map(
      (detail, index) => {
        if (index === detailIndex) {
          return {
            ...detail,

            [columnKey]:
              columnKey === "applyDate" ? String(value) : Number(value) || 0,
          };
        }
        return detail;
      }
    );

    // applyDate 변경 시 내림차순 정렬 및 가격 정보 업데이트
    if (columnKey === "applyDate") {
      // 내림차순 정렬
      updatedDetails.sort((a, b) => {
        const dateA = new Date(a.applyDate || "");
        const dateB = new Date(b.applyDate || "");
        return dateB.getTime() - dateA.getTime(); // 내림차순
      });

      // updatedDetails 전체의 price를 업데이트
      updatedDetails.forEach((detail, index) => {
        if (masterDataDetail.prescriptionLibraryDetails) {
          const newPrice = getPrice(
            masterDataDetail.prescriptionLibraryDetails,
            detail.applyDate || ""
          );
          updatedDetails[index] = {
            ...detail,
            price: newPrice.price,
            additionalPrice: newPrice.additionalPrice,
          };
        }
      });
    }

    setMasterDataDetail({
      ...masterDataDetail,
      priceDetails: updatedDetails,
    });
  };

  const handleSelectedRows = async (selectedRows: MyGridRowType[]) => {
    setSelectedRows(selectedRows);
  };

  useEffect(() => {
    saveHeaders(LS_PRICE_DETAILS_HEADERS_KEY, headers);
  }, [headers]);

  return (
    <BoxContainer>
      <Box
        title="가격적용일"
        className="min-w-[10rem]"
        headerChildren={
          <div className="flex flex-row gap-2">
            <MyButton variant="outline" onClick={handleDelete}>삭제</MyButton>
            <MyButton onClick={handleAdd}>추가</MyButton>
          </div>
        }
      >
        <div className="flex w-full h-full flex-col min-h-[8rem] max-h-[30vh] my-scroll">
          <MyGrid
            headers={headers}
            onHeadersChange={setHeaders}
            data={data}
            onDataChange={handleDataChange}
            size="sm"
            isRowSelectByCheckbox={true}
            onSelectedRowsChange={handleSelectedRows}
          />
        </div>
      </Box>
    </BoxContainer>
  );
}
