import {
  ClipboardPlus,
  Folder,
  Globe,
  Armchair,
  Image,
  Lightbulb,
  Users,
  Puzzle,
  BarChart3,
  Receipt,
  Settings,
  Bell,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navigationSections: NavSection[] = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Solicitudes", href: "/solicitudes", icon: ClipboardPlus },
      { name: "Notificaciones", href: "/notificaciones", icon: Bell },
      { name: "Proyectos", href: "/proyectos", icon: Folder },
      { name: "Web", href: "/web", icon: Globe },
      { name: "Productos", href: "/productos", icon: Armchair },
      { name: "Portafolio", href: "/portafolio", icon: Image },
      { name: "Aplicaciones", href: "/aplicaciones", icon: Lightbulb },
    ],
  },
  {
    label: "PLATAFORMA",
    items: [
      { name: "Equipo", href: "/equipo", icon: Users },
      { name: "Integraciones", href: "/integraciones", icon: Puzzle },
      { name: "Uso", href: "/uso", icon: BarChart3 },
      { name: "Facturación", href: "/facturacion", icon: Receipt },
      { name: "Configuración", href: "/configuracion", icon: Settings },
    ],
  },
]
