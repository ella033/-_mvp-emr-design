import type { Order } from "@/types/chart/order-types";
import { PaymentMethod, 보험구분상세 } from "@/constants/common/common-enum";
import { BundlePriceType } from "@/constants/bundle-price-type";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";

const SELF_PAY_METHODS = new Set([
  PaymentMethod.OneHundredPercent, // 5 백대백
  PaymentMethod.VeteranSelfPay, // 6 보훈본인부담
  PaymentMethod.EightyPercent, // 8 팔십대백
  PaymentMethod.FiftyPercent, // 9 오십대백
  PaymentMethod.NinetyPercent, // 10 구십대백
  PaymentMethod.ThirtyPercent, // 11 삼십대백
]);

function isSelfPayPaymentMethod(method: PaymentMethod): boolean {
  return SELF_PAY_METHODS.has(method);
}

/**
 * 기초자료(UserCode)에서 가져온 수납구분 정보
 */
export interface UserCodePaymentInfo {
  isNormalPrice: boolean; // 일반가여부 (다중체크 판단)
  paymentMethod: PaymentMethod; // 기초자료의 기본 수납방법
}

/**
 * 보험이력 변경 시 개별 처방의 paymentMethod와 isClaim을 조정하는 순수함수
 *
 * [paymentMethod 적용 규칙 - 우선순위 순]
 * 1. 직접입력 묶음 (bundlePriceType === 직접입력): 항상 수납없음(NoPayment)
 * 2. 기초자료 paymentMethod가 NoPayment(0), General(2), Actual(7)이 아니고 isNormalPrice가 true인 경우 (다중체크):
 *    보험구분에 따라 수납방법 자동변경
 *    - 일반 → generalPrice > 0이면 General(일반가), 0이면 Insurance(보험가)
 *    - 비일반 → 기초자료의 원래 paymentMethod로 복원
 * 3. 예외: 본인부담 단독체크이지만 보험→일반 변경 시 generalPrice가 0이면 Insurance(보험가)로 변경
 *    - 본인부담: 백대백(5), 보훈본인부담(6), 팔십대백(8), 오십대백(9), 구십대백(10), 삼십대백(11)
 * 4. 그 외: paymentMethod 변경 없음 (현재 값 유지)
 *
 * [isClaim 적용 규칙]
 * - typePrescriptionLibraryId === 0 또는 일반 → 비청구(false)
 * - 그 외 보험 → 청구(true)
 */
export function adjustOrderPaymentForInsuranceChange(
  order: Pick<
    Order,
    | "paymentMethod"
    | "isClaim"
    | "userCodeId"
    | "typePrescriptionLibraryId"
    | "bundlePriceType"
    | "generalPrice"
  >,
  newInsuranceType: 보험구분상세,
  userCodePaymentInfo?: UserCodePaymentInfo
): { paymentMethod: number; isClaim: boolean } {
  let adjustedPaymentMethod = order.paymentMethod;
  let adjustedIsClaim = order.isClaim;

  // 1. 직접입력 묶음은 수납없음 유지
  if (order.bundlePriceType === BundlePriceType.직접입력) {
    adjustedPaymentMethod = PaymentMethod.수납없음;
  }
  // 2. 다중체크: 기초자료 paymentMethod가 NoPayment, General, Actual이 아니고 isNormalPrice가 true
  else if (
    userCodePaymentInfo != null &&
    userCodePaymentInfo.paymentMethod !== PaymentMethod.수납없음 &&
    userCodePaymentInfo.paymentMethod !== PaymentMethod.일반가 &&
    userCodePaymentInfo.isNormalPrice
  ) {
    if (newInsuranceType === 보험구분상세.일반) {
      // 일반가가 존재하면 일반가, 없으면(0원) 보험가 유지
      adjustedPaymentMethod = order.generalPrice > 0 ? PaymentMethod.일반가 : PaymentMethod.보험가;
    } else {
      // 비일반 → 기초자료의 원래 paymentMethod로 복원
      adjustedPaymentMethod = userCodePaymentInfo.paymentMethod;
    }
  }
  // 3. 예외: 본인부담 단독체크이지만 보험→일반 변경 시 generalPrice가 0이면 보험가로 변경
  else if (
    userCodePaymentInfo != null &&
    userCodePaymentInfo.paymentMethod !== PaymentMethod.수납없음 &&
    userCodePaymentInfo.paymentMethod !== PaymentMethod.일반가 &&
    !userCodePaymentInfo.isNormalPrice &&
    newInsuranceType === 보험구분상세.일반 &&
    order.generalPrice === 0
  ) {
    adjustedPaymentMethod = PaymentMethod.보험가;
  }
  // 4. 그 외: paymentMethod 변경 없음 (현재 값 유지)

  // isClaim 조정: 보험구분 변경 시 isClaim을 새로 결정
  // - 일반 또는 typePrescriptionLibraryId===0 → 비청구
  // - 그 외 보험 → 청구
  if (order.typePrescriptionLibraryId === 0 || newInsuranceType === 보험구분상세.일반) {
    adjustedIsClaim = false;
  } else {
    adjustedIsClaim = true;
  }

  return { paymentMethod: adjustedPaymentMethod, isClaim: adjustedIsClaim };
}

/**
 * 처방 목록 전체에 보험변경 조정을 적용하는 순수함수
 */
export function adjustOrdersForInsuranceChange<
  T extends Pick<
    Order,
    | "paymentMethod"
    | "isClaim"
    | "userCodeId"
    | "typePrescriptionLibraryId"
    | "bundlePriceType"
    | "generalPrice"
  >,
>(
  orders: T[],
  newInsuranceType: 보험구분상세,
  userCodePaymentInfoMap: Map<number, UserCodePaymentInfo>
): T[] {
  return orders.map((order) => {
    const info = order.userCodeId ? userCodePaymentInfoMap.get(order.userCodeId) : undefined;

    const { paymentMethod, isClaim } = adjustOrderPaymentForInsuranceChange(
      order,
      newInsuranceType,
      info
    );

    return { ...order, paymentMethod, isClaim };
  });
}

/**
 * Order 목록에서 고유한 userCodeId를 추출하여 UserCode 수납구분 정보를 일괄 조회
 */
export async function fetchUserCodePaymentInfoMap(
  orders: Pick<Order, "userCodeId">[]
): Promise<Map<number, UserCodePaymentInfo>> {
  const uniqueUserCodeIds = [
    ...new Set(orders.map((o) => o.userCodeId).filter((id): id is number => id != null && id > 0)),
  ];

  const results = await Promise.all(
    uniqueUserCodeIds.map(async (id) => {
      try {
        const userCode = await PrescriptionUserCodeService.getPrescriptionUserCode(id);
        return [
          id,
          {
            isNormalPrice: userCode.isNormalPrice ?? false,
            paymentMethod: userCode.paymentMethod ?? PaymentMethod.보험가,
          },
        ] as const;
      } catch {
        return null;
      }
    })
  );

  const map = new Map<number, UserCodePaymentInfo>();
  for (const result of results) {
    if (result) map.set(result[0], result[1]);
  }
  return map;
}
