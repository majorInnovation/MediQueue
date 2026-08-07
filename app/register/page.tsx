import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Register Patient - Medical Queue System',
  description: 'Patient registration and queue assignment',
}

export default function RegisterPage() {
  redirect('/admin/queue')
}
