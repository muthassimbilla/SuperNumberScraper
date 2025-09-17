"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Users, Database, Activity } from "lucide-react"

export default function ExtensionControlPanel() {
  const [extensionConfig, setExtensionConfig] = useState({
    enabled: true,
    features: {
      phoneScrapingEnabled: true,
      autoSaveEnabled: true,
      realTimeSync: true,
    },
    uiConfig: {
      theme: "light",
      showStats: true,
      compactMode: false,
    },
  })

  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    dataScraped: 0,
    apiCalls: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch users
      const usersResponse = await fetch("/api/extension/users")
      if (!usersResponse.ok) {
        console.error("[v0] Users API failed:", usersResponse.status, usersResponse.statusText)
        setUsers([])
      } else {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Fetch stats
      const statsResponse = await fetch("/api/extension/stats")
      if (!statsResponse.ok) {
        console.error("[v0] Stats API failed:", statsResponse.status, statsResponse.statusText)
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          dataScraped: 0,
          apiCalls: 0,
        })
      } else {
        const statsData = await statsResponse.json()
        setStats(
          statsData.stats || {
            totalUsers: 0,
            activeUsers: 0,
            dataScraped: 0,
            apiCalls: 0,
          },
        )
      }

      // Fetch current config
      const configResponse = await fetch("/api/extension/config")
      if (!configResponse.ok) {
        console.error("[v0] Config API failed:", configResponse.status, configResponse.statusText)
      } else {
        const configData = await configResponse.json()
        if (configData.config) {
          setExtensionConfig(configData.config)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = async (newConfig: any) => {
    try {
      const response = await fetch("/api/extension/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config: newConfig }),
      })

      if (response.ok) {
        setExtensionConfig(newConfig)
        console.log("[v0] Configuration updated successfully")
      } else {
        console.error("[v0] Failed to update configuration")
      }
    } catch (error) {
      console.error("[v0] Error updating config:", error)
    }
  }

  const handleUserAction = async (userId: number, action: string) => {
    try {
      const response = await fetch("/api/extension/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action }),
      })

      if (response.ok) {
        fetchDashboardData()
        console.log("[v0] User action completed:", action)
      } else {
        console.error("[v0] Failed to perform user action")
      }
    } catch (error) {
      console.error("[v0] Error performing user action:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Extension Control Panel</h1>
            <p className="text-muted-foreground">আপনার Chrome Extension পরিচালনা করুন</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={extensionConfig.enabled ? "default" : "secondary"}>
              {extensionConfig.enabled ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Scraped</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dataScraped.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Phone numbers collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.apiCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Extension Settings</CardTitle>
                <CardDescription>Configure your Chrome extension behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Extension Status</Label>
                    <div className="text-sm text-muted-foreground">Enable or disable the extension globally</div>
                  </div>
                  <Switch
                    checked={extensionConfig.enabled}
                    onCheckedChange={(checked) => handleConfigUpdate({ ...extensionConfig, enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Phone Scraping</Label>
                    <div className="text-sm text-muted-foreground">Allow users to scrape phone numbers</div>
                  </div>
                  <Switch
                    checked={extensionConfig.features.phoneScrapingEnabled}
                    onCheckedChange={(checked) =>
                      handleConfigUpdate({
                        ...extensionConfig,
                        features: { ...extensionConfig.features, phoneScrapingEnabled: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Save</Label>
                    <div className="text-sm text-muted-foreground">Automatically save scraped data</div>
                  </div>
                  <Switch
                    checked={extensionConfig.features.autoSaveEnabled}
                    onCheckedChange={(checked) =>
                      handleConfigUpdate({
                        ...extensionConfig,
                        features: { ...extensionConfig.features, autoSaveEnabled: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Real-time Sync</Label>
                    <div className="text-sm text-muted-foreground">Sync data in real-time with server</div>
                  </div>
                  <Switch
                    checked={extensionConfig.features.realTimeSync}
                    onCheckedChange={(checked) =>
                      handleConfigUpdate({
                        ...extensionConfig,
                        features: { ...extensionConfig.features, realTimeSync: checked },
                      })
                    }
                  />
                </div>

                <Button onClick={() => handleConfigUpdate(extensionConfig)} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage extension users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  ) : (
                    users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{user.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.subscription === "premium" ? "default" : "secondary"}>
                              {user.subscription || "free"}
                            </Badge>
                            <Badge variant={user.status === "active" ? "default" : "outline"}>
                              {user.status || "inactive"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Last active: {user.last_active || "Never"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleUserAction(user.id, "suspend")}>
                            Suspend
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleUserAction(user.id, "upgrade")}>
                            Upgrade
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Control</CardTitle>
                <CardDescription>Control which features are available to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ui-config">UI Configuration (JSON)</Label>
                  <Textarea
                    id="ui-config"
                    placeholder="Enter UI configuration JSON..."
                    className="min-h-[200px] font-mono"
                    defaultValue={JSON.stringify(
                      {
                        features: [
                          {
                            id: "phone-scraper",
                            title: "Phone Scraper",
                            description: "Extract phone numbers from web pages",
                            enabled: true,
                            premium: false,
                          },
                          {
                            id: "data-export",
                            title: "Data Export",
                            description: "Export scraped data to CSV/Excel",
                            enabled: true,
                            premium: true,
                          },
                        ],
                      },
                      null,
                      2,
                    )}
                  />
                </div>
                <Button className="w-full">Update UI Configuration</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Monitor extension activity and errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    <span className="text-green-600">[INFO]</span> User logged in: user1@example.com
                  </div>
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    <span className="text-blue-600">[API]</span> Phone numbers scraped: 25 items
                  </div>
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    <span className="text-yellow-600">[WARN]</span> Rate limit approaching for user2@example.com
                  </div>
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    <span className="text-red-600">[ERROR]</span> Failed to sync data for user3@example.com
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
