'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Form, Input, Typography, Space, Alert, Avatar, Row, Col, Divider, message } from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  EditOutlined,
  MailOutlined,
  SaveOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

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
                        ROLE
                      </Text>
                      <Text strong style={{ fontSize: 16, textTransform: 'capitalize' }}>
                        {profile?.role}
                      </Text>
                    </Space>
                  </Col>

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
