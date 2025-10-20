'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { MailOutlined, LockOutlined, UserAddOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc/client'

const { Title, Text } = Typography

interface SignupFormValues {
  email: string
  password: string
  confirmPassword: string
}

export default function SignupPage() {
  const router = useRouter()
  const [form] = Form.useForm()

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
      router.refresh()
    },
  })

  const handleSubmit = (values: SignupFormValues) => {
    signUpMutation.mutate({
      email: values.email,
      password: values.password,
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #003366 0%, #001f3f 100%)',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <UserAddOutlined style={{ fontSize: 48, color: '#D4AF37', marginBottom: 16 }} />
          <Title level={2}>Create Account</Title>
          <Text type="secondary">Sign up to get started</Text>
        </div>

        {signUpMutation.isError && (
          <Alert
            message="Signup Failed"
            description={signUpMutation.error.message}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match!'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={signUpMutation.isPending}
              size="large"
              block
            >
              {signUpMutation.isPending ? 'Creating account...' : 'Sign Up'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text>
            Already have an account? <Link href="/login">Login</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
