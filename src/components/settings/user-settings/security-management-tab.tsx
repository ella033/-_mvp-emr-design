import React, { useEffect, useState } from "react";
import { MyAccountService, UserSession } from "@/services/my-account-service";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToastHelpers } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export function SecurityManagementTab() {
  const { success, error } = useToastHelpers();
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await MyAccountService.getOnlineSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
      // error("세션 정보를 불러오는데 실패했습니다."); // Optional: silent fail or notify
    }
  };

  const handleLogout = async (sessionId?: string) => {
    try {
      await MyAccountService.logoutSession(sessionId);
      if (sessionId) {
        success("선택한 기기에서 로그아웃 되었습니다.");
        loadSessions();
      } else {
        success("모든 기기에서 로그아웃 되었습니다.");
        // If logging out all (including current), usually we'd redirect to login, 
        // but here we just refresh list and let app handle auth state if token is invalidated.
        loadSessions();
      }
    } catch (e) {
      error("로그아웃 실패했습니다.");
    }
  };

  const handleCurrentSessionLogout = async () => {
    const currentSession = sessions.find(s => s.isCurrentSession);
    if (currentSession) {
      handleLogout(currentSession.sessionId);
    } else {
      // Fallback or just call logout without ID implies ALL, which includes current. 
      // But user asked strictly: "세션id가 지정된 경우 해당 세션만 로그아웃"
      // If we can't find current session ID, maybe we shouldn't call it or call with null?
      // Let's assume we can always find it if the list is loaded.
      error("현재 세션 정보를 찾을 수 없습니다.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title is already handled by parent tab layout usually, but user asked to match image. 
          Image had '사용자 설정' modal header. Tab content starts with '보안 관리'.
      */}

      <section className="space-y-4">
        <h3 className="text-lg font-bold">보안 관리</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h4 className="font-medium">비밀번호 관리</h4>
            <Button variant="outline" onClick={() => router.push("/auth/change-password")}>비밀번호 변경</Button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">로그아웃</h4>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCurrentSessionLogout}>이 기기에서 로그아웃</Button>
              <Button variant="outline" onClick={() => handleLogout(undefined)}>모든 기기에서 로그아웃</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="font-bold">접속 기기 관리</h4>
        <div className="border rounded-md">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center w-[200px]">접속일시</TableHead>
                <TableHead className="text-center w-[150px]">IP 주소</TableHead>
                <TableHead className="text-center">접속기기</TableHead>
                <TableHead className="text-center w-[120px]">접속 구분</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    접속된 세션 정보가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell className="text-center">
                      {/* Assuming LoginAt is ISO string, formatting to YYYY-MM-DD HH:mm:ss would be better but raw string is okay for now or use intl */}
                      {session.loginAt.replace("T", " ").substring(0, 19)}
                    </TableCell>
                    <TableCell className="text-center">{session.ipAddress}</TableCell>
                    <TableCell className="text-center">
                      {session.deviceInfo.device} {session.deviceInfo.browser} {session.deviceInfo.platform}
                    </TableCell>
                    <TableCell className="text-center">
                      {session.isCurrentSession ? (
                        <span className="text-primary font-medium">현재 기기</span>
                      ) : (
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          onClick={() => handleLogout(session.sessionId)}
                        >
                          로그아웃
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
