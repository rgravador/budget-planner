'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Form, Input, Typography, Space, Alert, Avatar, Row, Col, Divider, DatePicker, List } from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  EditOutlined,
  MailOutlined,
  SaveOutlined,
  IdcardOutlined,
  WalletOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useMessage } from '@/lib/antd/useMessage'
import dayjs, { Dayjs } from 'dayjs'

const { Header, Content } = Layout
const { Title, Text } = Typography

interface ProfileFormValues {
  name: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const message = useMessage()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch profile data
  const { data: profile, refetch: refetchProfile } = trpc.auth.getProfile.useQuery()

  // Fetch budget for selected month
  const { data: budgetData } = trpc.budget.getByMonth.useQuery({
    month: selectedMonth.format('YYYY-MM'),
  })

  // Fetch expenses by category for selected month to calculate total
  const { data: expensesByCategory = [] } = trpc.expense.getByCategory.useQuery({
    month: selectedMonth.format('YYYY-MM'),
  })

  const totalBudget = budgetData?.amount || 0
  const totalExpenses = expensesByCategory.reduce((sum, exp) => sum + exp.total, 0)
  const remainingBudget = totalBudget - totalExpenses

  // Update profile mutation
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      message.success('Profile updated successfully!')
      refetchProfile()
      setIsEditing(false)
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update profile')
    },
  })

  // Check if profile is incomplete
  const isProfileIncomplete = !profile?.name

  const handleSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate({
      name: values.name,
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    if (profile) {
      form.setFieldsValue({
        name: profile.name || '',
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.resetFields()
  }

  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date)
    }
  }

  // Get initials for avatar
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: '#D4AF37', fontSize: isMobile ? 20 : 18 }} />}
            onClick={() => router.push('/dashboard')}
            style={{ padding: isMobile ? '4px 8px' : '4px 15px' }}
          />
          <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#ffffff' }}>
            Profile
          </Title>
        </div>
      </Header>

      <Content
        style={{
          padding: isMobile ? '24px 16px' : '50px',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Incomplete Profile Alert */}
          {isProfileIncomplete && (
            <Alert
              message="Complete Your Profile"
              description="Your profile is incomplete. Please fill in all the information below to get the best experience."
              type="warning"
              showIcon
              closable
              style={{ borderRadius: 8 }}
            />
          )}

          {/* Profile Header Card - Facebook Style */}
          <Card
            style={{
              borderRadius: 8,
              overflow: 'hidden',
            }}
            styles={{ body: { padding: 0 } }}
            variant="borderless"
          >
            {/* Cover Photo Area */}
            <div
              style={{
                height: isMobile ? 120 : 200,
                background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
                position: 'relative',
              }}
            />

            {/* Profile Info Section */}
            <div style={{ padding: isMobile ? '0 16px 24px' : '0 24px 24px' }}>
              {/* Avatar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  marginTop: isMobile ? -50 : -80,
                  marginBottom: 16,
                }}
              >
                <Avatar
                  size={isMobile ? 100 : 160}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: '#D4AF37',
                    color: '#003366',
                    fontSize: isMobile ? 40 : 64,
                    fontWeight: 'bold',
                    border: '4px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {profile && getInitials(profile.name, profile.email)}
                </Avatar>
              </div>

              {/* Name and Edit Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 12 : 0,
                }}
              >
                <div>
                  <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
                    {profile?.name || 'No name set'}
                  </Title>
                  <Text type="secondary" style={{ fontSize: isMobile ? 14 : 16 }}>
                    {profile?.role === 'tracker' ? 'Budget Tracker' : 'Administrator'}
                  </Text>
                </div>

                {!isEditing && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    size={isMobile ? 'middle' : 'large'}
                    style={{
                      background: '#003366',
                      borderColor: '#003366',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Budget Overview Card */}
          <Card
            title={
              isMobile ? (
                <Space>
                  <WalletOutlined style={{ color: '#003366' }} />
                  <span style={{ color: '#003366', fontSize: 14 }}>Budget Overview</span>
                </Space>
              ) : (
                <Space>
                  <WalletOutlined style={{ color: '#003366' }} />
                  <span style={{ color: '#003366' }}>Budget Overview - {selectedMonth.format('MMM YYYY')}</span>
                </Space>
              )
            }
            style={{ borderRadius: 8 }}
            variant="borderless"
            extra={
              isMobile ? (
                <Space size={4}>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    format="MMM YY"
                    suffixIcon={<CalendarOutlined style={{ color: '#003366', fontSize: 12 }} />}
                    size="small"
                    style={{ width: 85 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined style={{ fontSize: 12 }} />}
                    onClick={() => router.push('/budget/new')}
                    size="small"
                    style={{
                      background: '#003366',
                      borderColor: '#003366',
                      padding: '0 8px',
                    }}
                  />
                </Space>
              ) : (
                <Space>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    format="MMM YYYY"
                    suffixIcon={<CalendarOutlined style={{ color: '#003366' }} />}
                    size="small"
                    style={{ width: 120 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/budget/new')}
                    size="small"
                    style={{
                      background: '#003366',
                      borderColor: '#003366',
                    }}
                  >
                    Add
                  </Button>
                </Space>
              )
            }
          >
            <List
              size="large"
              dataSource={[
                {
                  icon: <WalletOutlined style={{ fontSize: 20, color: '#003366' }} />,
                  label: 'Total Budget',
                  value: totalBudget,
                  color: '#003366',
                  bgColor: '#e6f0ff',
                },
                {
                  icon: <PlusOutlined style={{ fontSize: 20, color: '#D4AF37' }} />,
                  label: 'Total Expenses',
                  value: totalExpenses,
                  color: '#D4AF37',
                  bgColor: '#fffbe6',
                },
                {
                  icon: remainingBudget >= 0
                    ? <CalendarOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                    : <CalendarOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />,
                  label: remainingBudget >= 0 ? 'Remaining Budget' : 'Over Budget',
                  value: Math.abs(remainingBudget),
                  color: remainingBudget >= 0 ? '#52c41a' : '#ff4d4f',
                  bgColor: remainingBudget >= 0 ? '#f6ffed' : '#fff1f0',
                },
              ]}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: isMobile ? '12px' : '16px',
                    background: item.bgColor,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: isMobile ? 40 : 48,
                          height: isMobile ? 40 : 48,
                          borderRadius: '50%',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {item.icon}
                      </div>
                    }
                    title={
                      <Text style={{ fontSize: isMobile ? 13 : 14, color: '#666' }}>
                        {item.label}
                      </Text>
                    }
                    description={
                      <Title
                        level={isMobile ? 4 : 3}
                        style={{
                          margin: '4px 0 0 0',
                          color: item.color,
                          fontWeight: 600,
                        }}
                      >
                        ₱{item.value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Title>
                    }
                  />
                </List.Item>
              )}
            />

            {/* No Budget Alert */}
            {totalBudget === 0 && (
              <Alert
                message="No Budget Set"
                description={`You haven't set a budget for ${selectedMonth.format('MMMM YYYY')}. Click "Add" to set your monthly budget.`}
                type="info"
                showIcon
                style={{ borderRadius: 8, marginTop: 12 }}
              />
            )}
          </Card>

          {/* Profile Details Card */}
          <Card
            title={
              <Space>
                <IdcardOutlined style={{ color: '#003366' }} />
                <span style={{ color: '#003366' }}>Profile Information</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
            variant="borderless"
          >
            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="large"
              >
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[
                    { required: true, message: 'Please enter your name!' },
                    { min: 2, message: 'Name must be at least 2 characters!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your full name"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={updateProfileMutation.isPending}
                      size="large"
                      style={{
                        background: '#003366',
                        borderColor: '#003366',
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} size="large">
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        FULL NAME
                      </Text>
                      <Space>
                        <UserOutlined style={{ color: '#003366' }} />
                        <Text strong style={{ fontSize: 16 }}>
                          {profile?.name || <Text type="secondary">Not set</Text>}
                        </Text>
                      </Space>
                    </Space>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        EMAIL
                      </Text>
                      <Space>
                        <MailOutlined style={{ color: '#003366' }} />
                        <Text strong style={{ fontSize: 16 }}>
                          {profile?.email}
                        </Text>
                      </Space>
                    </Space>
                  </Col>
                </Row>

                <Divider style={{ margin: 0 }} />

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        MEMBER SINCE
                      </Text>
                      <Text strong style={{ fontSize: 16 }}>
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Unknown'}
                      </Text>
                    </Space>
                  </Col>
                </Row>
              </Space>
            )}
          </Card>
        </Space>
      </Content>
    </Layout>
  )
}
