import { ReactNode } from 'react'

interface WidgetShellProps {
  title: string
  children: ReactNode
  controls?: ReactNode
}

export default function WidgetShell({ title, children, controls }: WidgetShellProps) {
  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3>{title}</h3>
      </div>
      <div className="widget-body">
        {controls}
        {children}
      </div>
    </div>
  )
}
