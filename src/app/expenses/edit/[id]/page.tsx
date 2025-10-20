'use client'

import { useRouter, useParams } from 'next/navigation'
import { Layout, Card, Button, Form, Input, InputNumber, Select, Typography, Space, Spin } from 'antd'
import {
  ArrowLeftOutlined,
  TagOutlined,
  SaveOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useMessage } from '@/lib/antd/useMessage'
import dayjs from 'dayjs'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

interface ExpenseFormValues {
  category: string
  description: string
  amount: number
}

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const expenseId = params.id as string
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

  // Fetch the expense to edit
  const { data: expense, isLoading } = trpc.expense.getById.useQuery({
    id: expenseId,
  })

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = trpc.category.getAll.useQuery()

  // Update expense mutation
  const updateExpenseMutation = trpc.expense.update.useMutation({
    onSuccess: () => {
      message.success('Expense updated successfully!')
      router.push('/dashboard')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update expense')
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

  // Set form values when expense data is loaded
  useEffect(() => {
    if (expense) {
      form.setFieldsValue({
        category: expense.category,
        description: expense.description,
        amount: parseFloat(expense.amount),
      })
    }
  }, [expense, form])

  const handleSubmit = (values: ExpenseFormValues) => {
    updateExpenseMutation.mutate({
      id: expenseId,
      category: values.category,
      description: values.description,
      amount: values.amount,
      expenseDate: expense?.expense_date,
    })
  }

  const handleCancel = () => {
    router.back()
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

  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  if (!expense) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>Expense not found</Title>
            <Button type="primary" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Content>
      </Layout>
    )
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
            Edit Expense
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
                <Text type="secondary">Update the information below</Text>
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  Created: {dayjs(expense.expense_date).format('MMM DD, YYYY')}
                </Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="large"
              >
                <Form.Item
                  name="category"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Category</span>}
                  rules={[{ required: true, message: 'Please select a category!' }]}
                >
                  <Select
                    placeholder="Select a category"
                    suffixIcon={<TagOutlined />}
                    style={{ width: '100%', fontSize: 16 }}
                    size="large"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                          <Space style={{ width: '100%', marginBottom: 8 }}>
                            <Input
                              placeholder="New category name"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onPressEnter={handleAddCategory}
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
                    {categories.map((cat) => (
                      <Select.Option key={cat.id} value={cat.name}>
                        {cat.name}
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
                    placeholder="What did you buy?"
                    rows={4}
                    style={{ fontSize: 16 }}
                  />
                </Form.Item>

                <Form.Item
                  name="amount"
                  label={<span style={{ fontSize: 16, fontWeight: 500 }}>Amount (₱)</span>}
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

                <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={updateExpenseMutation.isPending}
                      size="large"
                      block
                      style={{
                        height: 56,
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      {updateExpenseMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="large"
                      block
                      style={{
                        height: 56,
                        fontSize: 18,
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
                <Text type="secondary">Update the information below</Text>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Created: {dayjs(expense.expense_date).format('MMMM DD, YYYY')}
                </Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select a category!' }]}
                >
                  <Select
                    placeholder="Select a category"
                    suffixIcon={<TagOutlined />}
                    style={{ width: '100%' }}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                          <Space style={{ width: '100%', marginBottom: 8 }}>
                            <Input
                              placeholder="New category name"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onPressEnter={handleAddCategory}
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
                    {categories.map((cat) => (
                      <Select.Option key={cat.id} value={cat.name}>
                        {cat.name}
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
                    placeholder="What did you buy?"
                    rows={4}
                  />
                </Form.Item>

                <Form.Item
                  name="amount"
                  label="Amount (₱)"
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

                <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateExpenseMutation.isPending} size="large">
                      {updateExpenseMutation.isPending ? 'Saving...' : 'Save Changes'}
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
