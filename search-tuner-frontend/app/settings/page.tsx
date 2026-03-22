import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Info, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      description="시스템 설정 관리"
    >
      <div className="space-y-6 max-w-2xl">
        {/* LLM Settings - Read Only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LLM 설정</CardTitle>
            <CardDescription>AI 설정은 서버 환경 변수(.env)로 관리됩니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                LLM 모델 및 API 키는 서버의 <code className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">.env</code> 파일에서 관리됩니다.
                변경하려면 환경 변수를 수정 후 서버를 재시작하세요.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">환경설정</CardTitle>
            <CardDescription>애플리케이션 동작 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 재색인</Label>
                <p className="text-xs text-muted-foreground">
                  동의어 적용 시 자동으로 재색인 실행
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>알림</Label>
                <p className="text-xs text-muted-foreground">
                  작업 완료 시 브라우저 알림 표시
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">빠른 링크</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="http://localhost:8080/swagger-ui" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Swagger UI
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="http://localhost:5601" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Kibana
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
