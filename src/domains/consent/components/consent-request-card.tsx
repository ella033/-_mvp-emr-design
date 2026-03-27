import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import type { ConsentRequest } from "../types";

interface ConsentRequestCardProps {
  request: ConsentRequest;
  onClick: () => void;
}

export function ConsentRequestCard({ request, onClick }: ConsentRequestCardProps) {
  const getStatusColor = (status: ConsentRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: ConsentRequest['status']) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'in_progress':
        return '작성 중';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatBirthDate = (birthDate?: string) => {
    if (!birthDate) return '';
    return new Date(birthDate).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card 
      data-testid="tablet-consent-request-card"
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
        request.status === 'pending' 
          ? 'hover:border-blue-300 bg-white' 
          : request.status === 'completed'
          ? 'opacity-60 cursor-not-allowed'
          : 'bg-blue-50 border-blue-200'
      }`}
      onClick={request.status === 'completed' ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {request.patientName}
            </h3>
          </div>
          <Badge 
            variant="outline" 
            className={getStatusColor(request.status)}
          >
            {getStatusText(request.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {request.patientBirthDate && (
          <div className="text-sm text-gray-600">
            생년월일: {formatBirthDate(request.patientBirthDate)}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>요청 시간: {formatTime(request.requestedAt)}</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          요청자: {request.requestedBy}
        </div>
        
        {request.status === 'pending' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              터치하여 동의서 작성
            </div>
          </div>
        )}
        
        {request.status === 'in_progress' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              작성 중...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
