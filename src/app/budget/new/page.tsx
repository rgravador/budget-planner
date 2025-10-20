'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Form, InputNumber, DatePicker, Typography, Space } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { trpc } from '@/lib/trpc/client'
import { useMessage } from '@/lib/antd/useMessage'

const { Header, Content } = Layout
const { Title, Text } = Typography

interface BudgetFormValues {
  amount: number
  month: Dayjs
}

export default function NewBudgetPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)
  const message = useMessage()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Create budget mutation
  const createBudgetMutation = trpc.budget.create.useMutation({
    onSuccess: () => {
      message.success('Budget saved successfully!')
      router.push('/dashboard')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to save budget')
    },
  })

  const handleSubmit = (values: BudgetFormValues) => {
    createBudgetMutation.mutate({
      amount: values.amount,
      budgetMonth: values.month.format('YYYY-MM'),
    })
  }

  const handleCancel = () => {
    router.push('/dashboard')
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
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: '#D4AF37', fontSize: isMobile ? 20 : 18 }} />}
            onClick={handleCancel}
            style={{ padding: isMobile ? '4px 8px' : '4px 15px' }}
          />
          <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#ffffff' }}>
            Add New Budget
          </Title>
        </div>
      </Header>

      <Content
        style={{
          padding: isMobile ? '24px 16px' : '50px',
          maxWidth: 800,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {isMobile ? (
          <div style={{ width: '100%' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Budget Details
                </Title>
                <Text type="secondary">Fill in the information below</Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                size="large"
                initialValues={{
                  month: dayjs(),
                }}
              >
                <Form.Item
                  name="amount"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Budget Amount</span>}
                  rules={[
                    { required: true, message: 'Please enter an amount!' },
                    { type: 'number', min: 0.01, message: 'Amount must be greater than 0!' },
                  ]}
                >
                  <InputNumber
                    type="number"
                    placeholder="0.00"
                    prefix="₱"
                    style={{ width: '100%', fontSize: 16 }}
                    precision={2}
                    min={0}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="month"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Budget Month</span>}
                  rules={[{ required: true, message: 'Please select a month!' }]}
                >
                  <DatePicker
                    picker="month"
                    format="MMMM YYYY"
                    suffixIcon={<CalendarOutlined />}
                    style={{ width: '100%', fontSize: 16 }}
                    size="large"
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={createBudgetMutation.isPending}
                      size="large"
                      block
                      style={{
                        height: 56,
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      {createBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="large"
                      block
                      style={{
                        height: 56,
                        fontSize: 16,
                      }}
                    >
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Space>
          </div>
        ) : (
          <Card style={{ borderRadius: 8 }} variant="borderless">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Budget Details
                </Title>
                <Text type="secondary">Fill in the information below</Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                size="large"
                initialValues={{
                  month: dayjs(),
                }}
              >
                <Form.Item
                  name="amount"
                  label="Budget Amount"
                  rules={[
                    { required: true, message: 'Please enter an amount!' },
                    { type: 'number', min: 0.01, message: 'Amount must be greater than 0!' },
                  ]}
                >
                  <InputNumber
                    type="number"
                    placeholder="0.00"
                    prefix="₱"
                    style={{ width: '100%' }}
                    precision={2}
                    min={0}
                  />
                </Form.Item>

                <Form.Item
                  name="month"
                  label="Budget Month"
                  rules={[{ required: true, message: 'Please select a month!' }]}
                >
                  <DatePicker
                    picker="month"
                    format="MMMM YYYY"
                    suffixIcon={<CalendarOutlined />}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={createBudgetMutation.isPending} size="large">
                      {createBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
                    </Button>
                    <Button onClick={handleCancel} size="large">
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
