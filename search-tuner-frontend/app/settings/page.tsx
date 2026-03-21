import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      description="시스템 설정 및 연결 관리"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Elasticsearch Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elasticsearch 연결</CardTitle>
            <CardDescription>Elasticsearch 클러스터 연결 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Host URL</Label>
              <Input defaultValue="http://localhost:9200" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Username (optional)</Label>
                <Input placeholder="elastic" />
              </div>
              <div className="space-y-2">
                <Label>Password (optional)</Label>
                <Input type="password" placeholder="********" />
              </div>
            </div>
            <Button>연결 테스트</Button>
          </CardContent>
        </Card>

        {/* MySQL Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MySQL 연결</CardTitle>
            <CardDescription>데이터베이스 연결 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Host</Label>
              <Input defaultValue="localhost" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Port</Label>
                <Input defaultValue="3306" />
              </div>
              <div className="space-y-2">
                <Label>Database</Label>
                <Input defaultValue="search_tuner" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input defaultValue="root" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="********" />
            </div>
            <Button>연결 테스트</Button>
          </CardContent>
        </Card>

        {/* LLM Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LLM 설정</CardTitle>
            <CardDescription>AI 동의어 생성 및 품질 평가에 사용할 LLM 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input type="password" placeholder="sk-..." />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input defaultValue="gpt-4o" />
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

        <div className="flex justify-end">
          <Button>설정 저장</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
