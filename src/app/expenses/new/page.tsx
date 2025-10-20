'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Form, Input, InputNumber, Select, Typography, Space, DatePicker } from 'antd'
import {
  ArrowLeftOutlined,
  TagOutlined,
  SaveOutlined,
  PlusOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useMessage } from '@/lib/antd/useMessage'
import dayjs, { Dayjs } from 'dayjs'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

interface ExpenseFormValues {
  category: string
  description: string
  amount: number
  expenseDate: Dayjs
}

export default function NewExpensePage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const message = useMessage()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = trpc.category.getAll.useQuery()

  // Create expense mutation
  const createExpenseMutation = trpc.expense.create.useMutation({
    onSuccess: () => {
      message.success('Expense saved successfully!')
      router.push('/dashboard')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to save expense')
    },
  })

  // Create category mutation
  const createCategoryMutation = trpc.category.create.useMutation({
    onSuccess: (data) => {
      message.success(`Category "${data.name}" added successfully!`)
      refetchCategories()
      form.setFieldValue('category', data.name)
      setNewCategoryName('')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create category')
    },
  })

  const handleSubmit = (values: ExpenseFormValues) => {
    createExpenseMutation.mutate({
      category: values.category,
      description: values.description,
      amount: values.amount,
      expenseDate: values.expenseDate.format('YYYY-MM-DD'),
    })
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  const handleAddCategory = () => {
    if (newCategoryName) {
      createCategoryMutation.mutate({
        name: newCategoryName,
        icon: 'TagOutlined',
      })
    }
  }

  const handleAddCategoryClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault()
    handleAddCategory()
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
            Add New Expense
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
                  Expense Details
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
                  expenseDate: dayjs(),
                }}
              >
                <Form.Item
                  name="category"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Category</span>}
                  rules={[{ required: true, message: 'Please select a category!' }]}
                >
                  <Select
                    placeholder="Select or search category"
                    suffixIcon={<TagOutlined />}
                    style={{ fontSize: 16 }}
                    size="large"
                    showSearch
                    filterOption={(input, option) =>
                      ((option?.label || option?.children) as string).toLowerCase().includes(input.toLowerCase())
                    }
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <div style={{ padding: '8px', borderTop: '1px solid #d9d9d9' }}>
                          <Space style={{ width: '100%' }}>
                            <Input
                              placeholder="New category name"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onPressEnter={() => handleAddCategory()}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={handleAddCategoryClick}
                              loading={createCategoryMutation.isPending}
                            >
                              {createCategoryMutation.isPending ? 'Adding...' : 'Add'}
                            </Button>
                          </Space>
                        </div>
                      </>
                    )}
                  >
                    {categories.map((category) => (
                      <Select.Option key={category.id} value={category.name}>
                        {category.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Description</span>}
                  rules={[
                    { required: true, message: 'Please enter a description!' },
                    { min: 3, message: 'Description must be at least 3 characters!' },
                  ]}
                >
                  <TextArea
                    placeholder="Enter expense description"
                    rows={4}
                    style={{ fontSize: 16 }}
                  />
                </Form.Item>

                <Form.Item
                  name="amount"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Amount</span>}
                  rules={[
                    { required: true, message: 'Please enter an amount!' },
                    { type: 'number', min: 0.01, message: 'Amount must be greater than 0!' },
                  ]}
                >
                  <InputNumber
                    type="number"
                    placeholder="0.00"
                    addonBefore="₱"
                    style={{ width: '100%', fontSize: 16 }}
                    precision={2}
                    min={0}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="expenseDate"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Date</span>}
                  rules={[{ required: true, message: 'Please select a date!' }]}
                >
                  <DatePicker
                    format="MMMM DD, YYYY"
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
                      loading={createExpenseMutation.isPending}
                      size="large"
                      block
                      style={{
                        height: 56,
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      {createExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
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
                  Expense Details
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
                  expenseDate: dayjs(),
                }}
              >
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select a category!' }]}
                >
                  <Select
                    placeholder="Select or search category"
                    suffixIcon={<TagOutlined />}
                    showSearch
                    filterOption={(input, option) =>
                      ((option?.label || option?.children) as string).toLowerCase().includes(input.toLowerCase())
                    }
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <div style={{ padding: '8px', borderTop: '1px solid #d9d9d9' }}>
                          <Space style={{ width: '100%' }}>
                            <Input
                              placeholder="New category name"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onPressEnter={() => handleAddCategory()}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={handleAddCategoryClick}
                              loading={createCategoryMutation.isPending}
                            >
                              {createCategoryMutation.isPending ? 'Adding...' : 'Add'}
                            </Button>
                          </Space>
                        </div>
                      </>
                    )}
                  >
                    {categories.map((category) => (
                      <Select.Option key={category.id} value={category.name}>
                        {category.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[
                    { required: true, message: 'Please enter a description!' },
                    { min: 3, message: 'Description must be at least 3 characters!' },
                  ]}
                >
                  <TextArea
                    placeholder="Enter expense description"
                    rows={4}
                  />
                </Form.Item>

                <Form.Item
                  name="amount"
                  label="Amount"
                  rules={[
                    { required: true, message: 'Please enter an amount!' },
                    { type: 'number', min: 0.01, message: 'Amount must be greater than 0!' },
                  ]}
                >
                  <InputNumber
                    type="number"
                    placeholder="0.00"
                    addonBefore="₱"
                    style={{ width: '100%' }}
                    precision={2}
                    min={0}
                  />
                </Form.Item>

                <Form.Item
                  name="expenseDate"
                  label="Date"
                  rules={[{ required: true, message: 'Please select a date!' }]}
                >
                  <DatePicker
                    format="MMMM DD, YYYY"
                    suffixIcon={<CalendarOutlined />}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={createExpenseMutation.isPending} size="large">
                      {createExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
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
