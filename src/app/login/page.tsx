'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'

const { Title, Text } = Typography

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
      router.refresh()
    },
  })

  const handleSubmit = (values: LoginFormValues) => {
    signInMutation.mutate(values)
  }

  const formContent = (
    <>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 24 }}>
        <Title
          level={isMobile ? 1 : 2}
          style={{
            color: isMobile ? '#ffffff' : undefined,
            marginBottom: isMobile ? 12 : undefined
          }}
        >
          Welcome Back
        </Title>
        <Text
          type={isMobile ? undefined : 'secondary'}
          style={{
            color: isMobile ? 'rgba(255, 255, 255, 0.85)' : undefined,
            fontSize: isMobile ? 16 : undefined
          }}
        >
          Sign in to your account
        </Text>
      </div>

      {signInMutation.isError && (
        <Alert
          message="Login Failed"
          description={signInMutation.error.message}
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
          <Input
            prefix={<MailOutlined style={{ fontSize: isMobile ? 20 : 14 }} />}
            placeholder="Email"
            size={isMobile ? 'large' : 'large'}
            style={{
              height: isMobile ? 56 : undefined,
              fontSize: isMobile ? 16 : undefined,
              borderRadius: isMobile ? 12 : undefined
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ fontSize: isMobile ? 20 : 14 }} />}
            placeholder="Password"
            size={isMobile ? 'large' : 'large'}
            style={{
              height: isMobile ? 56 : undefined,
              fontSize: isMobile ? 16 : undefined,
              borderRadius: isMobile ? 12 : undefined
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={signInMutation.isPending}
            size="large"
            block
            style={{
              height: isMobile ? 56 : undefined,
              fontSize: isMobile ? 18 : undefined,
              fontWeight: isMobile ? 600 : undefined,
              borderRadius: isMobile ? 12 : undefined,
              marginTop: isMobile ? 24 : undefined
            }}
          >
            {signInMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: isMobile ? 32 : 16 }}>
        <Text style={{
          color: isMobile ? 'rgba(255, 255, 255, 0.85)' : undefined,
          fontSize: isMobile ? 15 : undefined
        }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            style={{
              color: isMobile ? '#D4AF37' : undefined,
              fontWeight: isMobile ? 600 : undefined
            }}
          >
            Sign up
          </Link>
        </Text>
      </div>
    </>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #003366 0%, #001f3f 100%)',
        padding: isMobile ? '24px' : '0',
      }}
    >
      {isMobile ? (
        <div style={{ width: '100%', maxWidth: 400 }}>
          {formContent}
        </div>
      ) : (
        <Card
          style={{
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          variant="borderless"
        >
          {formContent}
        </Card>
      )}
    </div>
  )
}
