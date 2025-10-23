'use client'

import { useRouter, useParams } from 'next/navigation'
import { Layout, Card, Button, Typography, List, Space, Tag, DatePicker, Popconfirm } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { trpc } from '@/lib/trpc/client'
import { useMessage } from '@/lib/antd/useMessage'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function CategoryDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const categoryName = decodeURIComponent(params.category as string)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const message = useMessage()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch expenses for the selected category and month
  const { data: expenses = [], refetch: refetchExpenses } = trpc.expense.getAll.useQuery({
    month: selectedMonth.format('YYYY-MM'),
    category: categoryName,
  })

  // Delete expense mutation
  const deleteExpenseMutation = trpc.expense.delete.useMutation({
    onSuccess: () => {
      message.success('Expense deleted successfully!')
      refetchExpenses()
    },
    onError: (error) => {
      message.error(error.message || 'Failed to delete expense')
    },
  })

  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)

  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date)
    }
  }

  const handleDelete = (expenseId: string) => {
    deleteExpenseMutation.mutate({ id: expenseId })
  }

  const handleEdit = (expenseId: string) => {
    // Navigate to edit page (you can create this page later)
    router.push(`/expenses/edit/${expenseId}`)
  }

  const toggleExpanded = (expenseId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId)
      } else {
        newSet.add(expenseId)
      }
      return newSet
    })
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
            onClick={() => router.push('/dashboard')}
            style={{ padding: isMobile ? '4px 8px' : '4px 15px' }}
          />
          <Title level={isMobile ? 5 : 3} style={{ margin: 0, color: '#ffffff' }}>
            {categoryName}
          </Title>
        </div>
      </Header>

      <Content
        style={{
          padding: isMobile ? '24px 16px' : '50px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Summary and Filter Card */}
          <Card
            style={{
              borderRadius: 8,
              background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
            }}
            variant="borderless"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: isMobile ? 14 : 16 }}>
                    Total for {selectedMonth.format('MMMM YYYY')}
                  </Text>
                  <Title level={isMobile ? 3 : 2} style={{ margin: '8px 0 0 0', color: '#D4AF37' }}>
                    ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Title>
                </div>
                <div>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    format="MMMM YYYY"
                    suffixIcon={<CalendarOutlined style={{ color: '#D4AF37' }} />}
                    size={isMobile ? 'middle' : 'large'}
                    style={{ width: isMobile ? '100%' : 200 }}
                  />
                </div>
              </div>
              <div>
                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: isMobile ? 13 : 14 }}>
                  {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} found
                </Text>
              </div>
            </Space>
          </Card>

          {/* Expenses List */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#003366' }} />
                <span style={{ color: '#003366' }}>Expense Details</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
            variant="borderless"
          >
            {expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  No expenses found for {selectedMonth.format('MMMM YYYY')}
                </Text>
              </div>
            ) : (
              <List
                dataSource={expenses}
                renderItem={(expense) => (
                  <List.Item
                    style={{
                      padding: isMobile ? '16px 0' : '16px 8px',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', width: '100%', gap: 16, alignItems: 'flex-start' }}>
                      {/* Avatar */}
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
                          fontSize: isMobile ? 18 : 20,
                          flexShrink: 0,
                        }}
                      >
                        <FileTextOutlined />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 4 }}>
                          <Tag color="blue" style={{ fontSize: isMobile ? 12 : 13 }}>
                            {dayjs(expense.expense_date).format('dddd MMM D, YYYY')}
                          </Tag>
                        </div>
                        <div
                          onClick={() => toggleExpanded(expense.id)}
                          style={{
                            fontSize: isMobile ? 15 : 16,
                            fontWeight: 500,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: expandedIds.has(expense.id) ? 'unset' : 'ellipsis',
                            whiteSpace: expandedIds.has(expense.id) ? 'normal' : 'nowrap',
                            wordBreak: expandedIds.has(expense.id) ? 'break-word' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0 }}>{expense.description}</span>
                          {expense.description.length > 50 && (
                            expandedIds.has(expense.id) ? (
                              <UpOutlined style={{ fontSize: 10, color: '#666', flexShrink: 0 }} />
                            ) : (
                              <DownOutlined style={{ fontSize: 10, color: '#666', flexShrink: 0 }} />
                            )
                          )}
                        </div>
                      </div>

                      {/* Amount and Actions Container */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        <Text strong style={{ fontSize: isMobile ? 16 : 18, color: '#003366', whiteSpace: 'nowrap' }}>
                          ₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#003366', fontSize: isMobile ? 18 : 14 }} />}
                            onClick={() => handleEdit(expense.id)}
                            size={isMobile ? 'small' : 'middle'}
                          >
                            {!isMobile && 'Edit'}
                          </Button>
                          <Popconfirm
                            title="Delete Expense"
                            description="Are you sure you want to delete this expense?"
                            onConfirm={() => handleDelete(expense.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{
                              loading: deleteExpenseMutation.isPending,
                              danger: true,
                            }}
                          >
                            <Button
                              type="text"
                              icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? 18 : 14 }} />}
                              danger
                              size={isMobile ? 'small' : 'middle'}
                            >
                              {!isMobile && 'Delete'}
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
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
