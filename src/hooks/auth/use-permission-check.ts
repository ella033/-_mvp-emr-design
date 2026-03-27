import { useEffect, useRef } from "react";
import { useUserStore } from "@/store/user-store";
import { usePermissionStore } from "@/store/permission-store";
import { PermissionsService } from "@/services/permission-service";

export function usePermissionCheck() {
  const { user } = useUserStore();
  const { setPermissions, setOwner, setLoading, clearPermissions } =
    usePermissionStore();

  // hospitalId가 변경될 때마다 권한 다시 체크
  const currentHospitalId = user?.hospitalId;

  // 이전 hospitalId 추적을 통해 중복 호출 방지 (선택 사항이나 useEffect 의존성으로 처리)
  useEffect(() => {
    const fetchPermissions = async () => {
      // 1. 유저 정보나 hospitalId가 없으면 권한 초기화
      if (!user || !user.hospitals || !currentHospitalId) {
        clearPermissions();
        return;
      }

      // 2. 현재 선택된 병원 정보 찾기
      const currentHospital = user.hospitals.find(
        (h) => h.hospitalId === currentHospitalId
      );

      if (!currentHospital) {
        clearPermissions();
        return;
      }

      setLoading(true);

      try {
        // 3. 소유자 여부 체크
        // API 응답의 isOwner는 boolean 타입이라고 가정
        if (currentHospital.isOwner) {
          setOwner(true);
          setPermissions([]); // 소유자는 별도 권한 리스트 필요 없음 (Store에서 hasPermission이 true 처리)
          console.log("[Permission] 병원 소유자 권한 부여");
        } else {
          setOwner(false);
          // 4. RoleId가 있으면 권한 조회
          if (currentHospital.roleId) {
            const permissions = await PermissionsService.getRolePermissions(
              currentHospital.roleId
            );
            setPermissions(permissions);
            console.log(
              `[Permission] 권한 로드 완료 (Role: ${currentHospital.roleName})`,
              permissions
            );
          } else {
            console.warn("[Permission] Role ID가 없습니다.");
            setPermissions([]);
          }
        }
      } catch (error) {
        console.error("[Permission] 권한 로드 중 에러 발생", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [currentHospitalId, user, setPermissions, setOwner, setLoading, clearPermissions]);
}
