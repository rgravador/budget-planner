'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Typography, List, Space, Row, Col, DatePicker } from 'antd'
import {
  LogoutOutlined,
  DashboardOutlined,
  PlusOutlined,
  RightOutlined,
  ShoppingOutlined,
  CarOutlined,
  CoffeeOutlined,
  VideoCameraOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  BookOutlined,
  GlobalOutlined,
  SmileOutlined,
  TagOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { trpc } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'

const { Header, Content } = Layout
const { Title, Text } = Typography

// Icon mapping for categories
const iconMap: Record<string, React.ReactNode> = {
  CoffeeOutlined: <CoffeeOutlined />,
  CarOutlined: <CarOutlined />,
  ShoppingOutlined: <ShoppingOutlined />,
  VideoCameraOutlined: <VideoCameraOutlined />,
  HomeOutlined: <HomeOutlined />,
  MedicineBoxOutlined: <MedicineBoxOutlined />,
  BookOutlined: <BookOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  SmileOutlined: <SmileOutlined />,
  TagOutlined: <TagOutlined />,
}

export default function DashboardPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch categories
  const { data: categories = [] } = trpc.category.getAll.useQuery()

  // Fetch expenses by category for selected month
  const { data: expensesByCategory = [] } = trpc.expense.getByCategory.useQuery({
    month: selectedMonth.format('YYYY-MM'),
  })

  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      router.push('/login')
      router.refresh()
    },
  })

  const handleSignOut = () => {
    signOutMutation.mutate()
  }

  // Merge categories with expense data
  const categoryData = categories.map((category) => {
    const expenseData = expensesByCategory.find((e) => e.category === category.name)
    return {
      category: category.name,
      total: expenseData?.total || 0,
      count: expenseData?.count || 0,
      icon: iconMap[category.icon || 'TagOutlined'] || <TagOutlined />,
    }
  })

  // Filter out categories with no expenses for cleaner display
  const activeCategoryData = categoryData.filter((cat) => cat.count > 0)

  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.total, 0)

  const handleCategoryClick = (category: string) => {
    router.push(`/expenses/category/${encodeURIComponent(category)}`)
  }

  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          padding: isMobile ? '0 16px' : '0 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DashboardOutlined style={{ fontSize: isMobile ? 20 : 24, color: '#D4AF37' }} />
          <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#ffffff' }}>
            Budget Planner
          </Title>
        </div>
        <Space size="middle">
          <Button
            type="text"
            icon={<UserOutlined style={{ color: '#D4AF37' }} />}
            onClick={() => router.push('/profile')}
            size={isMobile ? 'middle' : 'large'}
            style={{ color: '#ffffff' }}
          >
            {!isMobile && 'Profile'}
          </Button>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleSignOut}
            loading={signOutMutation.isPending}
            size={isMobile ? 'middle' : 'large'}
          >
            {isMobile ? '' : (signOutMutation.isPending ? 'Signing out...' : 'Sign Out')}
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: isMobile ? '24px 16px' : '50px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Summary Card */}
          <Card style={{ borderRadius: 8, background: 'linear-gradient(135deg, #003366 0%, #004080 100%)' }} variant="borderless">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Month Filter */}
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    format="MMMM YYYY"
                    suffixIcon={<CalendarOutlined style={{ color: '#D4AF37' }} />}
                    size={isMobile ? 'middle' : 'large'}
                    style={{ width: isMobile ? '100%' : 200 }}
                  />
                </Col>
              </Row>

              {/* Total Expenses and Action Button */}
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} lg={12}>
                  <div>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: isMobile ? 14 : 16 }}>
                      Total Expenses for {selectedMonth.format('MMMM YYYY')}
                    </Text>
                    <Title level={isMobile ? 3 : 2} style={{ margin: '8px 0 0 0', color: '#D4AF37' }}>
                      ₱{totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} lg={12}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: isMobile ? 'flex-start' : 'flex-end',
                      width: '100%'
                    }}
                  >
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={() => router.push('/expenses/new')}
                      style={{
                        background: '#D4AF37',
                        borderColor: '#D4AF37',
                        color: '#003366',
                        fontWeight: 600,
                        height: isMobile ? 48 : 56,
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      Add New Expense
                    </Button>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Categories List */}
          <Card
            title={
              <Space>
                <TagOutlined style={{ color: '#003366' }} />
                <span style={{ color: '#003366' }}>Expense Categories</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
            variant="borderless"
          >
            {activeCategoryData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  No expenses found for {selectedMonth.format('MMMM YYYY')}
                </Text>
              </div>
            ) : (
              <List
                dataSource={activeCategoryData}
                renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: isMobile ? '16px 0' : '16px 8px',
                    borderRadius: 8,
                    transition: 'all 0.3s',
                  }}
                  onClick={() => handleCategoryClick(item.category)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f4f8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: isMobile ? 40 : 48,
                          height: isMobile ? 40 : 48,
                          borderRadius: '50%',
                          background: '#f0f4f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#003366',
                          fontSize: isMobile ? 20 : 24,
                        }}
                      >
                        {item.icon}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 500 }}>{item.category}</span>
                        <RightOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
                          {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                        </Text>
                        <Text strong style={{ fontSize: isMobile ? 16 : 18, color: '#003366' }}>
                          ₱{item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
                )}
              />
            )}
          </Card>
        </Space>
      </Content>
    </Layout>
  )
}
